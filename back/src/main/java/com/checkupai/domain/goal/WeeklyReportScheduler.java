package com.checkupai.domain.goal;

import com.checkupai.domain.notification.NotificationRepository;
import com.checkupai.domain.notification.NotificationService;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.goal.GoalItemDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeeklyReportScheduler {

    private static final String REPORT_TITLE = "이번 주 건강 리포트가 도착했어요";

    private final UserRepository userRepository;
    private final UserGoalService userGoalService;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    // 일요일 밤 실행 시점 기준 findAll()의 "이번 주 월~오늘" 범위가 곧 지난 한 주 전체와 같다
    @Scheduled(cron = "0 0 21 * * SUN")
    @Transactional
    public void sendWeeklyReports() {
        var todayStart = LocalDate.now().atStartOfDay();
        int sent = 0;

        for (User user : userRepository.findAll()) {
            List<GoalItemDto> goals = userGoalService.findAll(user.getId());
            if (goals.isEmpty()) continue;

            boolean alreadySent = notificationRepository
                    .existsByUserIdAndTitleAndCreatedAtAfter(user.getId(), REPORT_TITLE, todayStart);
            if (alreadySent) continue;

            int avgPct = (int) Math.round(goals.stream().mapToInt(GoalItemDto::getPct).average().orElse(0));
            if (notificationService.createIfAllowed(user.getId(), "weekly", REPORT_TITLE,
                    "이번 주 목표 달성률은 평균 " + avgPct + "%예요. 건강 탭에서 자세히 확인해보세요.") == null) continue;
            sent++;
        }
        log.info("주간 건강 리포트 알림 발송 완료: {}건", sent);
    }
}
