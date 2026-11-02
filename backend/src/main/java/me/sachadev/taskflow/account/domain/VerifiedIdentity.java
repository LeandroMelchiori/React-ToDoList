package me.sachadev.taskflow.account.domain;

public record VerifiedIdentity(String issuer, String subject, String email, boolean emailVerified) { }
