package me.sachadev.taskflow.calendars.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.sachadev.taskflow.calendars.PersonalCalendars.Calendar;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@Profile("database")
public class CalendarRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<Calendar> mapper = (row, index) -> new Calendar(row.getObject("id", UUID.class),
        row.getString("name"), row.getString("time_zone"), row.getLong("revision"), row.getObject("owner_user_id", UUID.class), null);

    public CalendarRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void createDefault(UUID actorId, String timeZone) {
        jdbc.update("insert into calendars(id, owner_user_id, name, client_id, time_zone) values (?, ?, 'Personal', 'personal', ?)",
            UUID.randomUUID(), actorId, timeZone);
    }

    public List<Calendar> list(UUID actorId) {
        return jdbc.query("select * from calendars where owner_user_id = ? order by id", mapper, actorId);
    }

    public Optional<Calendar> find(UUID actorId, UUID calendarId) {
        return jdbc.query("select * from calendars where id = ? and owner_user_id = ?", mapper, calendarId, actorId).stream().findFirst();
    }
}
