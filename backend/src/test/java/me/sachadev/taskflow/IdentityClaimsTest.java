package me.sachadev.taskflow;

import java.util.Map;
import me.sachadev.taskflow.account.IdentityClaims;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import static org.assertj.core.api.Assertions.assertThat;

class IdentityClaimsTest {
    private final String namespace = "https://taskflow.sachadev.me/claims";

    private Jwt jwt(Map<String, Object> claims) {
        return Jwt.withTokenValue("verified-by-security-chain").header("alg", "RS256")
            .issuer("https://issuer.example.test/").subject("person").claims(values -> values.putAll(claims)).build();
    }

    @Test
    void readsOnlyTheConfiguredNamespacedClaims() {
        var adapter = new IdentityClaims(namespace + "/email", namespace + "/email_verified");
        var identity = adapter.from(jwt(Map.of(namespace + "/email", "person@example.test", namespace + "/email_verified", true,
            "email", "other@example.test", "email_verified", false)));
        assertThat(identity.email()).isEqualTo("person@example.test");
        assertThat(identity.emailVerified()).isTrue();
        assertThat(adapter.from(jwt(Map.of("email", "other@example.test", "email_verified", true))).emailVerified()).isFalse();
        assertThat(adapter.from(jwt(Map.of(namespace + "/email_verified", "true"))).emailVerified()).isFalse();
    }
}
