package me.sachadev.taskflow.calendars;

import java.util.List;
import java.util.UUID;
import me.sachadev.taskflow.calendars.infrastructure.CalendarRepository;
import me.sachadev.taskflow.shared.persistence.ActorContext;
import me.sachadev.taskflow.shared.web.ApiException;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("database")
public class PersonalCalendars {
    public record Calendar(UUID id, String name, String timeZone, long revision, UUID ownerUserId, UUID groupId) { }
    public record Page(List<Calendar> items, String nextCursor) { }
    private final CalendarRepository repository;
    private final ActorContext actors;

    public PersonalCalendars(CalendarRepository repository, ActorContext actors) {
        this.repository = repository;
        this.actors = actors;
    }

    @Transactional
    public void createDefault(UUID actorId, String timeZone) {
        actors.use(actorId);
        repository.createDefault(actorId, timeZone);
    }

    @Transactional(readOnly = true)
    public Page list(UUID actorId) {
        actors.use(actorId);
        return new Page(repository.list(actorId), null);
    }

    @Transactional(readOnly = true)
    public Calendar find(UUID actorId, UUID calendarId) {
        actors.use(actorId);
        return repository.find(actorId, calendarId)
            .orElseThrow(() -> new ApiException(404, "not_found", "Calendario no disponible."));
    }
}
