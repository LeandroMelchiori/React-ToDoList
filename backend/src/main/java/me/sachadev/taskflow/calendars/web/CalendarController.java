package me.sachadev.taskflow.calendars.web;

import java.util.UUID;
import me.sachadev.taskflow.account.AccountService;
import me.sachadev.taskflow.account.IdentityClaims;
import me.sachadev.taskflow.calendars.PersonalCalendars;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("cloud")
class CalendarController {
    private final AccountService accounts;
    private final PersonalCalendars calendars;

    CalendarController(AccountService accounts, PersonalCalendars calendars) {
        this.accounts = accounts;
        this.calendars = calendars;
    }

    @GetMapping("/api/v1/calendars")
    PersonalCalendars.Page list(@AuthenticationPrincipal Jwt jwt) {
        return calendars.list(accounts.currentProfile(IdentityClaims.from(jwt)).id());
    }

    @GetMapping("/api/v1/calendars/{calendarId}")
    PersonalCalendars.Calendar find(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID calendarId) {
        return calendars.find(accounts.currentProfile(IdentityClaims.from(jwt)).id(), calendarId);
    }
}
