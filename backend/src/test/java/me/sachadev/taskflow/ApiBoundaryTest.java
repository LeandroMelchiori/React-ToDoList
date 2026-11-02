package me.sachadev.taskflow;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiBoundaryTest {
    @Autowired Environment environment;
    @Autowired ApplicationContext context;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + environment.getProperty("local.server.port") + path))
            .timeout(Duration.ofSeconds(5));
    }

    @Test
    void healthIsPublicWithoutExposingInternals() throws Exception {
        var response = client.send(request("/actuator/health").GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("{\"status\":\"UP\"}");
        assertThat(response.headers().allValues("set-cookie")).isEmpty();
        assertThat(context.getBeansOfType(UserDetailsService.class)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/v1/me", "/api/v1/calendars", "/actuator/env", "/login"})
    void anonymousRequestsAreRejectedWithoutRedirectsOrSessions(String path) throws Exception {
        var response = client.send(request(path).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.headers().firstValue("content-type")).hasValueSatisfying(value -> assertThat(value).startsWith("application/json"));
        assertThat(response.body()).contains("\"code\":\"unauthorized\"", "\"requestId\":\"");
        assertThat(response.headers().allValues("location")).isEmpty();
        assertThat(response.headers().allValues("set-cookie")).isEmpty();
    }

    @Test
    void unverifiedBearerTokensCannotWriteOrSupplyAnOwner() throws Exception {
        var response = client.send(request("/api/v1/calendars")
            .header("Authorization", "Bearer unverified")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{\"ownerId\":\"another-user\"}"))
            .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.headers().allValues("set-cookie")).isEmpty();
    }
}
