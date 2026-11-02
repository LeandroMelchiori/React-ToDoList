package me.sachadev.taskflow.account.web;

import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import me.sachadev.taskflow.account.AccountService;
import me.sachadev.taskflow.account.IdentityClaims;
import me.sachadev.taskflow.account.domain.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@org.springframework.context.annotation.Profile("cloud")
class AccountController {
    record RedeemRequest(
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_-]{43}$") String token,
        @NotBlank @Pattern(regexp = "^[a-z0-9_]{3,32}$") String handle,
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Size(max = 100) String timeZone) { }
    private final AccountService accounts;

    AccountController(AccountService accounts) { this.accounts = accounts; }

    @GetMapping("/api/v1/me")
    Profile me(@AuthenticationPrincipal Jwt jwt) {
        return accounts.currentProfile(IdentityClaims.from(jwt));
    }

    @PostMapping("/api/v1/account/invitations/redeem")
    Profile redeem(@AuthenticationPrincipal Jwt jwt, @RequestHeader("Idempotency-Key") UUID operationId,
        @Valid @RequestBody RedeemRequest request) {
        return accounts.redeem(IdentityClaims.from(jwt), operationId, request.token(), request.handle(), request.displayName(), request.timeZone());
    }
}
