package me.sachadev.taskflow.account;

import me.sachadev.taskflow.account.domain.VerifiedIdentity;
import org.springframework.security.oauth2.jwt.Jwt;

public final class IdentityClaims {
    private IdentityClaims() { }

    public static VerifiedIdentity from(Jwt jwt) {
        Object email = jwt.getClaim("email");
        return new VerifiedIdentity(jwt.getIssuer().toString(), jwt.getSubject(), email instanceof String value ? value : "",
            Boolean.TRUE.equals(jwt.getClaim("email_verified")));
    }
}
