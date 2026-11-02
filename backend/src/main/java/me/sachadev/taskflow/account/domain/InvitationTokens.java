package me.sachadev.taskflow.account.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

public final class InvitationTokens {
    private InvitationTokens() { }

    public static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    public static String email(String value) {
        return value == null ? "" : value.strip().toLowerCase(Locale.ROOT);
    }

    public static boolean validEmail(String value) {
        return value.length() <= 254 && value.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+");
    }
}
