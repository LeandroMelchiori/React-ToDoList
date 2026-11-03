package me.sachadev.taskflow;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.sql.DriverManager;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import me.sachadev.taskflow.account.InvitationIssuer;
import me.sachadev.taskflow.account.domain.InvitationTokens;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.flywaydb.core.Flyway;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("cloud")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AccountAccessTest {
    private static final PostgreSQLContainer database = new PostgreSQLContainer("postgres:17").withDatabaseName("taskflow");
    private static final String appPassword = "test-only-app-password";
    private static final String audience = "taskflow-test-api";
    private static RSAKey key;
    private static HttpServer jwksServer;
    private static String issuer;
    @Autowired Environment environment;
    @Autowired JdbcTemplate jdbc;
    @Autowired InvitationIssuer invitations;
    @Autowired TransactionTemplate transactions;
    @Autowired FlywayMigrationStrategy migrationStrategy;
    private final JsonMapper json = JsonMapper.builder().build();
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry properties) throws Exception {
        database.start();
        try (var connection = DriverManager.getConnection(database.getJdbcUrl(), database.getUsername(), database.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("create role taskflow_app login password '" + appPassword + "' nosuperuser nocreatedb nocreaterole");
            statement.execute("grant usage, create on schema public to taskflow_app");
        }
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var pair = generator.generateKeyPair();
        key = new RSAKey.Builder((RSAPublicKey) pair.getPublic()).privateKey((RSAPrivateKey) pair.getPrivate()).keyID("test-key").build();
        jwksServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        jwksServer.createContext("/jwks.json", exchange -> {
            byte[] body = new JWKSet(key.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) { output.write(body); }
        });
        jwksServer.start();
        issuer = "http://127.0.0.1:" + jwksServer.getAddress().getPort();
        properties.add("spring.datasource.url", database::getJdbcUrl);
        properties.add("spring.datasource.username", () -> "taskflow_app");
        properties.add("spring.datasource.password", () -> appPassword);
        properties.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> issuer);
        properties.add("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", () -> issuer + "/jwks.json");
        properties.add("spring.security.oauth2.resourceserver.jwt.audiences", () -> audience);
        properties.add("taskflow.web-origins", () -> "http://127.0.0.1:5173");
    }

    @AfterAll
    static void stop() {
        if (jwksServer != null) jwksServer.stop(0);
        database.stop();
    }

    @BeforeEach
    void clearTestDatabase() {
        jdbc.execute("truncate enrollment_requests, auth_identities, access_invitations, calendars, users cascade");
    }

    private JdbcTemplate admin() {
        return new JdbcTemplate(new DriverManagerDataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword()));
    }

    private String token(String subject, String email, Object verified, Map<String, Object> overrides) throws Exception {
        var claims = new JWTClaimsSet.Builder().issuer(issuer).subject(subject).audience(audience)
            .issueTime(Date.from(Instant.now())).expirationTime(Date.from(Instant.now().plusSeconds(600)))
            .claim("email", email).claim("email_verified", verified);
        overrides.forEach(claims::claim);
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims.build());
        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }

    private String token(String subject, String email) throws Exception { return token(subject, email, true, Map.of()); }

    private HttpRequest.Builder request(String path, String token) {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + environment.getProperty("local.server.port") + "/api/v1" + path))
            .timeout(Duration.ofSeconds(10));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return builder;
    }

    private HttpResponse<String> get(String path, String token) throws Exception {
        return client.send(request(path, token).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private Map<String, String> body(String invitation, String handle) {
        return Map.of("token", invitation, "handle", handle, "displayName", "Persona " + handle, "timeZone", "America/Argentina/Buenos_Aires");
    }

    private HttpRequest enrollment(String jwt, UUID operationId, Map<String, String> body) {
        return request("/account/invitations/redeem", jwt).header("Content-Type", "application/json")
            .header("Idempotency-Key", operationId.toString()).POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
    }

    private HttpResponse<String> enroll(String jwt, String invitation, String handle) throws Exception {
        return client.send(enrollment(jwt, UUID.randomUUID(), body(invitation, handle)), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode enrollUser(String subject, String email, String handle) throws Exception {
        var response = enroll(token(subject, email), invitations.issue(email, 24).token(), handle);
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(200);
        return json.readTree(response.body());
    }

    @Test
    void requiresARealSignatureIssuerAudienceExpiryAndSubject() throws Exception {
        assertThat(get("/me", null).statusCode()).isEqualTo(401);
        assertThat(get("/me", "not-a-token").statusCode()).isEqualTo(401);
        for (var invalid : List.<Map<String, Object>>of(Map.of("iss", "https://wrong.example"), Map.of("aud", List.of("another-api")),
            Map.of("exp", Date.from(Instant.now().minusSeconds(3600))), Map.of("nbf", Date.from(Instant.now().plusSeconds(3600))), Map.of("sub", ""))) {
            assertThat(get("/me", token("alice", "alice@example.test", true, invalid)).statusCode()).isEqualTo(401);
        }
        var signed = SignedJWT.parse(token("alice", "alice@example.test"));
        var parts = signed.serialize().split("\\.");
        parts[2] = "A".repeat(parts[2].length());
        assertThat(get("/me", String.join(".", parts)).statusCode()).isEqualTo(401);
        var missingExpiry = new HashMap<String, Object>();
        missingExpiry.put("exp", null);
        assertThat(get("/me", token("alice", "alice@example.test", true, missingExpiry)).statusCode()).isEqualTo(401);
        assertThat(get("/me", token("not-invited", "new@example.test")).statusCode()).isEqualTo(403);
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isZero();
    }

    @Test
    void enrollsOnceAndPersistsPrivateProfileAndCalendar() throws Exception {
        String jwt = token("alice", "Alice@Example.test");
        String rawToken = invitations.issue(" ALICE@example.test ", 24).token();
        var response = enroll(jwt, rawToken, "alice");
        assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(200);
        var profile = json.readTree(response.body());
        assertThat(get("/me", jwt).body()).isEqualTo(response.body());
        var calendars = json.readTree(get("/calendars", jwt).body());
        assertThat(calendars.path("items").size()).isEqualTo(1);
        assertThat(calendars.path("items").get(0).path("ownerUserId").asString()).isEqualTo(profile.path("id").asString());
        assertThat(calendars.path("items").get(0).path("groupId").isNull()).isTrue();
        assertThat(jdbc.queryForObject("select token_hash from access_invitations", String.class)).isEqualTo(InvitationTokens.hash(rawToken)).doesNotContain(rawToken);
        assertThat(response.headers().allValues("set-cookie")).isEmpty();
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
    }

    @Test
    void rejectsWrongEmailUnverifiedExpiredRevokedAndConsumedInvitations() throws Exception {
        String rawToken = invitations.issue("alice@example.test", 24).token();
        assertThat(enroll(token("bob", "bob@example.test"), rawToken, "bob").statusCode()).isEqualTo(403);
        assertThat(enroll(token("alice", "alice@example.test", false, Map.of()), rawToken, "alice").statusCode()).isEqualTo(403);
        assertThat(enroll(token("alice", "alice@example.test", "true", Map.of()), rawToken, "alice").statusCode()).isEqualTo(403);
        jdbc.update("update access_invitations set expires_at = now() - interval '1 second'");
        assertThat(enroll(token("alice", "alice@example.test"), rawToken, "alice").statusCode()).isEqualTo(403);
        jdbc.update("update access_invitations set expires_at = now() + interval '1 day', revoked_at = now()");
        assertThat(enroll(token("alice", "alice@example.test"), rawToken, "alice").statusCode()).isEqualTo(403);
        jdbc.update("update access_invitations set revoked_at = null");
        assertThat(enroll(token("alice", "alice@example.test"), rawToken, "alice").statusCode()).isEqualTo(200);
        assertThat(enroll(token("another-subject", "alice@example.test"), rawToken, "another").statusCode()).isEqualTo(403);
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
    }

    @Test
    void retriesAreIdempotentAndConflictingReuseIsRejected() throws Exception {
        String jwt = token("alice", "alice@example.test");
        String rawToken = invitations.issue("alice@example.test", 24).token();
        UUID operation = UUID.randomUUID();
        var original = enrollment(jwt, operation, body(rawToken, "alice"));
        var first = client.send(original, HttpResponse.BodyHandlers.ofString());
        var replay = client.send(original, HttpResponse.BodyHandlers.ofString());
        assertThat(first.statusCode()).isEqualTo(200);
        assertThat(replay.body()).isEqualTo(first.body());
        assertThat(client.send(enrollment(jwt, operation, body(rawToken, "changed")), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(409);
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
        assertThat(admin().queryForObject("select count(*) from calendars", Integer.class)).isEqualTo(1);
    }

    @Test
    void simultaneousRetriesCreateExactlyOneAccount() throws Exception {
        var request = enrollment(token("alice", "alice@example.test"), UUID.randomUUID(), body(invitations.issue("alice@example.test", 24).token(), "alice"));
        var first = client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        var second = client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        assertThat(first.get().statusCode()).isEqualTo(200);
        assertThat(second.get().statusCode()).isEqualTo(200);
        assertThat(first.get().body()).isEqualTo(second.get().body());
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
        assertThat(admin().queryForObject("select count(*) from calendars", Integer.class)).isEqualTo(1);
    }

    @Test
    void competingIdentitiesCannotConsumeTheSameInvitationTwice() throws Exception {
        String rawToken = invitations.issue("shared@example.test", 24).token();
        var first = client.sendAsync(enrollment(token("first", "shared@example.test"), UUID.randomUUID(), body(rawToken, "first")), HttpResponse.BodyHandlers.ofString());
        var second = client.sendAsync(enrollment(token("second", "shared@example.test"), UUID.randomUUID(), body(rawToken, "second")), HttpResponse.BodyHandlers.ofString());
        assertThat(List.of(first.get().statusCode(), second.get().statusCode())).containsExactlyInAnyOrder(200, 403);
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
        assertThat(admin().queryForObject("select count(*) from calendars", Integer.class)).isEqualTo(1);
    }

    @Test
    void aSecondAccountCannotReadOrSelectTheFirstAccountsCalendar() throws Exception {
        var alice = enrollUser("alice", "alice@example.test", "alice");
        var bob = enrollUser("bob", "bob@example.test", "bob");
        String aliceJwt = token("alice", "alice@example.test");
        String bobJwt = token("bob", "bob@example.test");
        String calendarId = json.readTree(get("/calendars", aliceJwt).body()).path("items").get(0).path("id").asString();
        assertThat(get("/calendars/" + calendarId, aliceJwt).statusCode()).isEqualTo(200);
        assertThat(get("/calendars/" + calendarId, bobJwt).statusCode()).isEqualTo(404);
        var bobList = json.readTree(get("/calendars?ownerUserId=" + alice.path("id").asString(), bobJwt).body());
        assertThat(bobList.path("items").size()).isEqualTo(1);
        assertThat(bobList.path("items").get(0).path("ownerUserId").asString()).isEqualTo(bob.path("id").asString());
    }

    @Test
    void postgresEnforcesIsolationAndActorDoesNotLeakBetweenTransactions() throws Exception {
        var alice = enrollUser("alice", "alice@example.test", "alice");
        var bob = enrollUser("bob", "bob@example.test", "bob");
        assertThat(jdbc.queryForObject("select rolsuper or rolbypassrls from pg_roles where rolname = current_user", Boolean.class)).isFalse();
        assertThat(jdbc.queryForList("select * from users")).isEmpty();
        assertThat(jdbc.queryForList("select * from calendars")).isEmpty();
        transactions.executeWithoutResult(status -> {
            jdbc.queryForObject("select set_config('taskflow.actor_id', ?, true)", String.class, alice.path("id").asString());
            assertThat(jdbc.queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
            assertThat(jdbc.queryForObject("select count(*) from calendars", Integer.class)).isEqualTo(1);
            assertThat(jdbc.update("update users set display_name = 'Changed' where id = ?", UUID.fromString(bob.path("id").asString()))).isZero();
            assertThat(jdbc.update("delete from calendars where owner_user_id = ?", UUID.fromString(bob.path("id").asString()))).isZero();
        });
        assertThat(jdbc.queryForList("select * from users")).isEmpty();
        assertThat(jdbc.queryForList("select * from calendars")).isEmpty();
    }

    @Test
    void validatesEnrollmentAndRollsBackHandleConflictsWithoutConsumingTheInvitation() throws Exception {
        enrollUser("alice", "alice@example.test", "taken");
        String bobJwt = token("bob", "bob@example.test");
        String rawToken = invitations.issue("bob@example.test", 24).token();
        var missingKey = request("/account/invitations/redeem", bobJwt).header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body(rawToken, "bob")))).build();
        assertThat(client.send(missingKey, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(422);
        assertThat(enroll(bobJwt, rawToken, "taken").statusCode()).isEqualTo(409);
        var invalidZone = new HashMap<>(body(rawToken, "bob"));
        invalidZone.put("timeZone", "not/a-zone");
        assertThat(client.send(enrollment(bobJwt, UUID.randomUUID(), invalidZone), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(422);
        var spoofed = new HashMap<>(body(rawToken, "bob"));
        spoofed.put("ownerId", UUID.randomUUID().toString());
        assertThat(client.send(enrollment(bobJwt, UUID.randomUUID(), spoofed), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(422);
        assertThat(enroll(bobJwt, rawToken, "bob").statusCode()).isEqualTo(200);
        assertThat(admin().queryForObject("select count(*) from users", Integer.class)).isEqualTo(2);
    }

    @Test
    void invitationIssuanceValidatesItsInputs() {
        assertThatThrownBy(() -> invitations.issue("invalid", 24)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> invitations.issue("alice@example.test", 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> invitations.issue("alice@example.test", 169)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void refusesSuperuserConnectionsBeforeApplyingMigrations() {
        var privileged = Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword()).load();
        assertThatThrownBy(() -> migrationStrategy.migrate(privileged))
            .isInstanceOf(IllegalStateException.class).hasMessageContaining("SUPERUSER");
    }

    @Test
    void allowsOnlyConfiguredBrowserOriginsWithoutCookies() throws Exception {
        var preflight = request("/me", null).header("Origin", "http://127.0.0.1:5173")
            .header("Access-Control-Request-Method", "GET").header("Access-Control-Request-Headers", "authorization")
            .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build();
        var allowed = client.send(preflight, HttpResponse.BodyHandlers.ofString());
        assertThat(allowed.statusCode()).isEqualTo(200);
        assertThat(allowed.headers().firstValue("Access-Control-Allow-Origin")).hasValue("http://127.0.0.1:5173");
        assertThat(allowed.headers().allValues("Access-Control-Allow-Credentials")).isEmpty();
        var denied = request("/me", token("person", "person@example.test")).header("Origin", "https://other.example.test").GET().build();
        assertThat(client.send(denied, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
    }
}
