package me.sachadev.taskflow.account.domain;

import java.util.UUID;

public record Profile(UUID id, String handle, String displayName, String timeZone) { }
