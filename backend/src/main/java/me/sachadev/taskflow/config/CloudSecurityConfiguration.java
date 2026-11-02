package me.sachadev.taskflow.config;

import me.sachadev.taskflow.shared.web.ApiErrors;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration(proxyBeanMethods = false)
@Profile("cloud")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class CloudSecurityConfiguration {
    @Bean
    JwtDecoder jwtDecoder(
        @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer,
        @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwks,
        @Value("${spring.security.oauth2.resourceserver.jwt.audiences}") String audience) {
        if (issuer.isBlank() || jwks.isBlank() || audience.isBlank()) {
            throw new IllegalArgumentException("Identity provider configuration is required");
        }
        var decoder = NimbusJwtDecoder.withJwkSetUri(jwks).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer),
            new JwtClaimValidator<List<String>>("aud", values -> values != null && values.contains(audience)),
            new JwtClaimValidator<String>("sub", subject -> subject != null && !subject.isBlank() && subject.length() <= 255),
            new JwtClaimValidator<Instant>("exp", Objects::nonNull)));
        return decoder;
    }

    @Bean
    SecurityFilterChain cloudSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .requestCache(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(access -> access
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/account/invitations/redeem").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/me", "/api/v1/calendars", "/api/v1/calendars/*").authenticated()
                .anyRequest().denyAll())
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> { })
                .authenticationEntryPoint((request, response, exception) -> ApiErrors.unauthorized(response)))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, exception) -> ApiErrors.unauthorized(response))
                .accessDeniedHandler((request, response, exception) -> ApiErrors.forbidden(response)))
            .build();
    }
}
