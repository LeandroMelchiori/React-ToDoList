package me.sachadev.taskflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class TaskFlowApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskFlowApiApplication.class, args);
    }
}
