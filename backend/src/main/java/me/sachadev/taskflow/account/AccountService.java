package me.sachadev.taskflow.account;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import me.sachadev.taskflow.account.domain.InvitationTokens;
import me.sachadev.taskflow.account.domain.Profile;
import me.sachadev.taskflow.account.domain.VerifiedIdentity;
import me.sachadev.taskflow.account.infrastructure.AccountRepository;
import me.sachadev.taskflow.calendars.PersonalCalendars;
import me.sachadev.taskflow.shared.persistence.ActorContext;
import me.sachadev.taskflow.shared.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@org.springframework.context.annotation.Profile("database")
public class AccountService {
    private final AccountRepository repository;
    private final PersonalCalendars calendars;
    private final ActorContext actors;
    private final Clock clock;

    public AccountService(AccountRepository repository, PersonalCalendars calendars, ActorContext actors, Clock clock) {
        this.repository = repository;
        this.calendars = calendars;
        this.actors = actors;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Profile currentProfile(VerifiedIdentity identity) {
        UUID actorId = repository.findActor(identity)
            .orElseThrow(() -> new ApiException(403, "invitation_required", "Necesitas aceptar una invitación."));
        actors.use(actorId);
        return repository.profile(actorId);
    }

    @Transactional
    public Profile redeem(VerifiedIdentity identity, UUID operationId, String token, String handle, String displayName, String timeZone) {
        String email = InvitationTokens.email(identity.email());
        if (!identity.emailVerified() || !InvitationTokens.validEmail(email)) {
            throw new ApiException(403, "verified_email_required", "El proveedor debe verificar tu email.");
        }
        String zone;
        try { zone = ZoneId.of(timeZone).getId(); }
        catch (DateTimeException exception) { throw new ApiException(422, "invalid_time_zone", "La zona horaria no es válida."); }
        String name = displayName.strip();
        String fingerprint = InvitationTokens.hash(Stream.of(token, handle, name, zone)
            .map(value -> value.length() + ":" + value).collect(Collectors.joining()));

        // Serialize enrollment per verified identity; retries and concurrent requests share one account.
        repository.lockIdentity(identity);
        var previous = repository.enrollment(identity, operationId);
        if (previous.isPresent()) {
            if (!previous.get().requestHash().equals(fingerprint)) {
                throw new ApiException(409, "idempotency_conflict", "La clave de operación ya se usó con otros datos.");
            }
            actors.use(previous.get().userId());
            return repository.profile(previous.get().userId());
        }
        if (repository.findActor(identity).isPresent()) {
            throw new ApiException(409, "account_exists", "Esta identidad ya tiene una cuenta.");
        }
        var invitation = repository.lockInvitation(InvitationTokens.hash(token))
            .orElseThrow(AccountService::invalidInvitation);
        if (invitation.unavailable() || !invitation.expiresAt().isAfter(clock.instant()) || !invitation.email().equals(email)) {
            throw invalidInvitation();
        }
        var profile = new Profile(UUID.randomUUID(), handle, name, zone);
        actors.use(profile.id());
        repository.create(profile, identity, email);
        calendars.createDefault(profile.id(), zone);
        repository.finish(identity, operationId, fingerprint, profile.id(), invitation.id());
        return profile;
    }

    private static ApiException invalidInvitation() {
        return new ApiException(403, "invalid_invitation", "La invitación no está disponible para esta cuenta.");
    }
}
