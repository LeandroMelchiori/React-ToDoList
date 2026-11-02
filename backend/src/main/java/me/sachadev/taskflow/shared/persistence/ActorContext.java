package me.sachadev.taskflow.shared.persistence;

import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@Profile("database")
public class ActorContext {
    private final JdbcTemplate jdbc;

    public ActorContext(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void use(UUID actorId) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("Actor context requires a transaction");
        }
        // SET LOCAL must not leak an account identity into the next pooled connection borrower.
        jdbc.queryForObject("select set_config('taskflow.actor_id', ?, true)", String.class, actorId.toString());
    }
}
