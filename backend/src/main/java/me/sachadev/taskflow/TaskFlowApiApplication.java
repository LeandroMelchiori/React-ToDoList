package me.sachadev.taskflow;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class TaskFlowApiApplication {
    public static void main(String[] args) {
        // JDBC uses the JVM zone at connection startup; host aliases need not exist in PostgreSQL.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(TaskFlowApiApplication.class, args);
    }
}
