package com.checkupai.dto.notification;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class NotificationCreateRequest {

    private Long userId;

    @NotBlank
    private String title;

    @NotBlank
    private String message;
}
