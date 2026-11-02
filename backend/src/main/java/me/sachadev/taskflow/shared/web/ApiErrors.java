package me.sachadev.taskflow.shared.web;

import java.io.IOException;
import java.util.UUID;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiErrors {
    public record ErrorBody(String code, String message, UUID requestId) { }

    public static void unauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(401);
        response.setContentType("application/json");
        response.setHeader("WWW-Authenticate", "Bearer");
        response.getWriter().printf(
            "{\"code\":\"unauthorized\",\"message\":\"Authentication required\",\"requestId\":\"%s\"}", UUID.randomUUID());
    }

    public static void forbidden(HttpServletResponse response) throws IOException {
        response.setStatus(403);
        response.setContentType("application/json");
        response.getWriter().printf(
            "{\"code\":\"forbidden\",\"message\":\"Permission required\",\"requestId\":\"%s\"}", UUID.randomUUID());
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorBody> serviceFailure(ApiException exception) {
        return ResponseEntity.status(exception.status()).body(new ErrorBody(exception.code(), exception.getMessage(), UUID.randomUUID()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
        MissingRequestHeaderException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorBody> invalidInput(Exception exception) {
        return ResponseEntity.unprocessableContent().body(new ErrorBody("invalid_input", "Revisa los datos enviados.", UUID.randomUUID()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorBody> conflictingData(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409).body(new ErrorBody("account_conflict", "La cuenta o el nombre de usuario ya existe.", UUID.randomUUID()));
    }
}
