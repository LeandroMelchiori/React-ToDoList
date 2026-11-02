package me.sachadev.taskflow.account;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import me.sachadev.taskflow.account.domain.InvitationTokens;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("database")
public class InvitationIssuer {
    public record IssuedInvitation(String token, Instant expiresAt) { }
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public InvitationIssuer(JdbcTemplate jdbc, Clock clock) { this.jdbc = jdbc; this.clock = clock; }

    @Transactional
    public IssuedInvitation issue(String email, int hours) {
        String normalizedEmail = InvitationTokens.email(email);
        if (!InvitationTokens.validEmail(normalizedEmail) || hours < 1 || hours > 168) {
            throw new IllegalArgumentException("Use a valid email and a lifetime between 1 and 168 hours");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = clock.instant().plus(Duration.ofHours(hours));
        jdbc.update("insert into access_invitations(id, token_hash, email, expires_at) values (?, ?, ?, ?)",
            UUID.randomUUID(), InvitationTokens.hash(token), normalizedEmail, Timestamp.from(expiresAt));
        return new IssuedInvitation(token, expiresAt);
    }
}
