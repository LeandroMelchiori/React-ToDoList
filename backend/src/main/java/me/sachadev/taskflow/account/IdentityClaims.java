package me.sachadev.taskflow.account;

import me.sachadev.taskflow.account.domain.VerifiedIdentity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("cloud")
public final class IdentityClaims {
    private final String emailClaim;
    private final String verifiedClaim;

    public IdentityClaims(@Value("${taskflow.auth.email-claim:email}") String emailClaim,
        @Value("${taskflow.auth.email-verified-claim:email_verified}") String verifiedClaim) {
        this.emailClaim = emailClaim;
        this.verifiedClaim = verifiedClaim;
    }

    public VerifiedIdentity from(Jwt jwt) {
        Object email = jwt.getClaim(emailClaim);
        return new VerifiedIdentity(jwt.getIssuer().toString(), jwt.getSubject(), email instanceof String value ? value : "",
            Boolean.TRUE.equals(jwt.getClaim(verifiedClaim)));
    }
}
