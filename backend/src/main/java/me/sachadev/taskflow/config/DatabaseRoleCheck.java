package me.sachadev.taskflow.config;

import java.sql.SQLException;
import org.flywaydb.core.Flyway;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("database")
class DatabaseRoleCheck implements FlywayMigrationStrategy {
    @Override
    public void migrate(Flyway flyway) {
        // Check before migrations or HTTP startup, not after a privileged connection has been used.
        try (var connection = flyway.getConfiguration().getDataSource().getConnection();
             var statement = connection.prepareStatement("select rolsuper or rolbypassrls from pg_roles where rolname = current_user");
             var result = statement.executeQuery()) {
            if (!result.next() || result.getBoolean(1)) {
                throw new IllegalStateException("Use a PostgreSQL role without SUPERUSER or BYPASSRLS");
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Cannot verify PostgreSQL role", exception);
        }
        flyway.migrate();
    }
}
