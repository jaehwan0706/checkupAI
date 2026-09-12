package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.notification.NotificationSettingsService;
import com.checkupai.dto.notification.NotificationSettingsRequest;
import com.checkupai.dto.notification.NotificationSettingsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notification-settings")
@RequiredArgsConstructor
public class NotificationSettingsController {

    private final NotificationSettingsService notificationSettingsService;

    @GetMapping
    public @NonNull ApiResponse<NotificationSettingsResponse> getSettings(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(notificationSettingsService.getSettings(userId));
    }

    @PutMapping
    public @NonNull ApiResponse<NotificationSettingsResponse> updateSettings(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestBody @NonNull NotificationSettingsRequest request) {
        return ApiResponse.success(notificationSettingsService.updateSettings(userId, request), "알림 설정을 저장했어요");
    }
}
