package com.checkupai.domain.guide;

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

@Slf4j
@Component
@RequiredArgsConstructor
public class GuideReminderScheduler {

    private static final String REMINDER_TITLE = "오늘의 건강 습관, 아직이에요";
    private static final String REMINDER_MESSAGE = "오늘 실천한 건강 습관이 없어요. 건강 탭에서 맞춤 가이드를 확인하고 체크해보세요!";

    private final UserRepository userRepository;
    private final GuideCheckInService guideCheckInService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 0 20 * * *")
    @Transactional
    public void sendCheckInReminders() {
        var todayStart = LocalDate.now().atStartOfDay();
        int sent = 0;
        for (User user : userRepository.findAll()) {
            boolean checkedAny = guideCheckInService.getStatus(user.getId()).stream()
                    .anyMatch(GuideCheckInStatus::isCheckedToday);
            if (checkedAny) continue;

            boolean alreadySent = notificationRepository
                    .existsByUserIdAndTitleAndCreatedAtAfter(user.getId(), REMINDER_TITLE, todayStart);
            if (alreadySent) continue;

            if (notificationService.createIfAllowed(user.getId(), "tips", REMINDER_TITLE, REMINDER_MESSAGE) == null) continue;
            sent++;
        }
        log.info("체크인 리마인더 알림 발송 완료: {}건", sent);
    }
}
