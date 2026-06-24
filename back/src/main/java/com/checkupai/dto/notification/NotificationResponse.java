package com.checkupai.dto.notification;

import com.checkupai.domain.notification.Notification;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponse {

    private final Long id;
    private final String title;
    private final String message;
    private final boolean read;
    private final LocalDateTime createdAt;

    private NotificationResponse(Long id, String title, String message, boolean read, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
    }

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.isRead(), n.getCreatedAt());
    }
}
