package me.sachadev.taskflow.account.infrastructure;

import me.sachadev.taskflow.account.InvitationIssuer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("invite-admin")
class InvitationCommand implements ApplicationRunner {
    private final InvitationIssuer issuer;
    private final String email;
    private final int hours;

    InvitationCommand(InvitationIssuer issuer, @Value("${taskflow.invitation.email}") String email,
        @Value("${taskflow.invitation.hours:48}") int hours) {
        this.issuer = issuer;
        this.email = email;
        this.hours = hours;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        var invitation = issuer.issue(email, hours);
        // An explicit operator command prints the only recoverable copy; HTTP never issues invitations.
        System.out.println("Invitation token: " + invitation.token());
        System.out.println("Expires at: " + invitation.expiresAt());
    }
}
