package me.sachadev.taskflow.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("database")
class DatabaseConfiguration {
    @Bean
    Clock clock() { return Clock.systemUTC(); }
}
