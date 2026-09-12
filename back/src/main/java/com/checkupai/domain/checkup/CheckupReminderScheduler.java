package com.checkupai.domain.checkup;

import com.checkupai.domain.notification.NotificationRepository;
import com.checkupai.domain.notification.NotificationService;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class CheckupReminderScheduler {

    // 국가건강검진은 통상 1년 주기이므로, 마지막 검진일로부터 1년 후를 다음 권장일로 가정한다.
    private static final int CHECKUP_CYCLE_YEARS = 1;
    private static final int REMINDER_DAYS_BEFORE = 7;
    private static final String REMINDER_TITLE = "다음 건강검진이 곧이에요";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy년 M월 d일");

    private final UserRepository userRepository;
    private final HealthCheckupRepository checkupRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendCheckupReminders() {
        LocalDate today = LocalDate.now();
        var todayStart = today.atStartOfDay();
        int sent = 0;

        for (User user : userRepository.findAll()) {
            LocalDate nextDue = checkupRepository.findFirstByUserIdOrderByCheckupDateDesc(user.getId())
                    .map(HealthCheckup::getCheckupDate)
                    .map(d -> d.plusYears(CHECKUP_CYCLE_YEARS))
                    .orElse(null);
            if (nextDue == null || !nextDue.minusDays(REMINDER_DAYS_BEFORE).isEqual(today)) continue;

            boolean alreadySent = notificationRepository
                    .existsByUserIdAndTitleAndCreatedAtAfter(user.getId(), REMINDER_TITLE, todayStart);
            if (alreadySent) continue;

            if (notificationService.createIfAllowed(user.getId(), "checkup", REMINDER_TITLE,
                    nextDue.format(DATE_FMT) + " 무렵 건강검진을 받는 걸 권장해요. 미리 일정을 잡아보세요.") == null) continue;
            sent++;
        }
        log.info("검진일 리마인더 알림 발송 완료: {}건", sent);
    }
}
