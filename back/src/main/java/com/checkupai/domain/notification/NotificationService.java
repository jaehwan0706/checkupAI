package com.checkupai.domain.notification;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.dto.notification.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSettingsService notificationSettingsService;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByIsReadAscCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notifId) {
        Notification notification = notificationRepository.findById(notifId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!notification.getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        notification.markAsRead();
        return NotificationResponse.from(notification);
    }

    @Transactional
    public NotificationResponse create(Long targetUserId, String title, String message) {
        Notification notification = Notification.builder()
                .userId(targetUserId)
                .title(title)
                .message(message)
                .build();
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public boolean hasUnread(Long userId) {
        return notificationRepository.existsByUserIdAndIsReadFalse(userId);
    }

    /** 사용자의 알림 설정(카테고리·야간 방해 금지)을 확인한 뒤에만 알림을 생성한다. */
    @Transactional
    public NotificationResponse createIfAllowed(Long targetUserId, String category, String title, String message) {
        if (!notificationSettingsService.isEnabled(targetUserId, category)) return null;
        return create(targetUserId, title, message);
    }
}
