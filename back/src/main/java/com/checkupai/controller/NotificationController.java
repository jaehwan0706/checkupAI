package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.notification.NotificationService;
import com.checkupai.dto.notification.NotificationCreateRequest;
import com.checkupai.dto.notification.NotificationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(notificationService.getMyNotifications(userId));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ApiResponse.success(notificationService.markAsRead(userId, id));
    }

    @PostMapping
    public ApiResponse<NotificationResponse> create(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody NotificationCreateRequest request) {
        Long targetUserId = request.getUserId() != null ? request.getUserId() : userId;
        return ApiResponse.success(notificationService.create(targetUserId, request.getTitle(), request.getMessage()));
    }
}
