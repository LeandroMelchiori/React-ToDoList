package me.sachadev.taskflow.account.infrastructure;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import me.sachadev.taskflow.account.domain.Profile;
import me.sachadev.taskflow.account.domain.VerifiedIdentity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@org.springframework.context.annotation.Profile("database")
public class AccountRepository {
    public record Invitation(UUID id, String email, Instant expiresAt, boolean unavailable) { }
    public record Enrollment(String requestHash, UUID userId) { }
    private final JdbcTemplate jdbc;

    public AccountRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void lockIdentity(VerifiedIdentity identity) {
        var lockKey = identity.issuer().length() + ":" + identity.issuer() + identity.subject();
        jdbc.queryForList("select pg_advisory_xact_lock(hashtextextended(?, 0))", lockKey);
    }

    public Optional<UUID> findActor(VerifiedIdentity identity) {
        return jdbc.query("select user_id from auth_identities where issuer = ? and subject = ?",
            (row, index) -> row.getObject("user_id", UUID.class), identity.issuer(), identity.subject()).stream().findFirst();
    }

    public Optional<Enrollment> enrollment(VerifiedIdentity identity, UUID operationId) {
        return jdbc.query("select request_hash, user_id from enrollment_requests where issuer = ? and subject = ? and operation_id = ?",
            (row, index) -> new Enrollment(row.getString("request_hash"), row.getObject("user_id", UUID.class)),
            identity.issuer(), identity.subject(), operationId).stream().findFirst();
    }

    public Optional<Invitation> lockInvitation(String tokenHash) {
        return jdbc.query("select id, email, expires_at, revoked_at, redeemed_at from access_invitations where token_hash = ? for update",
            (row, index) -> new Invitation(row.getObject("id", UUID.class), row.getString("email"),
                row.getTimestamp("expires_at").toInstant(), row.getTimestamp("revoked_at") != null || row.getTimestamp("redeemed_at") != null),
            tokenHash).stream().findFirst();
    }

    public Profile profile(UUID actorId) {
        return jdbc.queryForObject("select id, handle, display_name, time_zone from users where id = ?",
            (row, index) -> new Profile(row.getObject("id", UUID.class), row.getString("handle"), row.getString("display_name"), row.getString("time_zone")), actorId);
    }

    public void create(Profile profile, VerifiedIdentity identity, String email) {
        jdbc.update("insert into users(id, email, handle, display_name, time_zone) values (?, ?, ?, ?, ?)",
            profile.id(), email, profile.handle(), profile.displayName(), profile.timeZone());
        jdbc.update("insert into auth_identities(issuer, subject, user_id) values (?, ?, ?)", identity.issuer(), identity.subject(), profile.id());
    }

    public void finish(VerifiedIdentity identity, UUID operationId, String requestHash, UUID actorId, UUID invitationId) {
        jdbc.update("update access_invitations set redeemed_at = now(), redeemed_by = ? where id = ?", actorId, invitationId);
        jdbc.update("insert into enrollment_requests(issuer, subject, operation_id, request_hash, user_id) values (?, ?, ?, ?, ?)",
            identity.issuer(), identity.subject(), operationId, requestHash, actorId);
    }
}
