package com.checkupai.domain.notification;

import com.checkupai.dto.notification.NotificationSettingsRequest;
import com.checkupai.dto.notification.NotificationSettingsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class NotificationSettingsService {

    private static final LocalTime DND_START = LocalTime.of(22, 0);
    private static final LocalTime DND_END = LocalTime.of(8, 0);

    private final NotificationSettingsRepository settingsRepository;

    @Transactional
    public @NonNull NotificationSettings getOrCreate(@NonNull Long userId) {
        return settingsRepository.findByUserId(userId)
                .orElseGet(() -> settingsRepository.save(NotificationSettings.defaultsFor(userId)));
    }

    // getOrCreate()가 신규 사용자면 INSERT까지 수행할 수 있어 readOnly로 두면 안 된다
    // (같은 클래스 내부 호출은 프록시를 안 거쳐 이 메서드의 트랜잭션 설정이 그대로 적용됨)
    @Transactional
    public @NonNull NotificationSettingsResponse getSettings(@NonNull Long userId) {
        return NotificationSettingsResponse.from(getOrCreate(userId));
    }

    @Transactional
    public @NonNull NotificationSettingsResponse updateSettings(@NonNull Long userId, @NonNull NotificationSettingsRequest req) {
        NotificationSettings settings = getOrCreate(userId);
        settings.update(req.isCheckupReminder(), req.isReportDone(), req.isAbnormalAlert(),
                req.isTipsReminder(), req.isWeeklyReport(), req.isMarketing(), req.isDnd());
        return NotificationSettingsResponse.from(settings);
    }

    /** 특정 카테고리 알림을 지금 이 사용자에게 보내도 되는지 판단한다 (야간 방해 금지 포함). */
    @Transactional
    public boolean isEnabled(@NonNull Long userId, @NonNull String category) {
        NotificationSettings s = getOrCreate(userId);
        if (s.isDnd() && isNightTime()) return false;
        return switch (category) {
            case "checkup" -> s.isCheckupReminder();
            case "reportDone" -> s.isReportDone();
            case "abnormal" -> s.isAbnormalAlert();
            case "tips" -> s.isTipsReminder();
            case "weekly" -> s.isWeeklyReport();
            default -> true;
        };
    }

    private boolean isNightTime() {
        LocalTime now = LocalTime.now();
        return now.isAfter(DND_START) || now.isBefore(DND_END);
    }
}
