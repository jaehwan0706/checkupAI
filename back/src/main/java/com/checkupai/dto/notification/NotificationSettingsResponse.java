package com.checkupai.dto.notification;

import com.checkupai.domain.notification.NotificationSettings;
import lombok.Builder;
import lombok.Getter;
import org.springframework.lang.NonNull;

@Getter
@Builder
public class NotificationSettingsResponse {
    private boolean checkupReminder;
    private boolean reportDone;
    private boolean abnormalAlert;
    private boolean tipsReminder;
    private boolean weeklyReport;
    private boolean marketing;
    private boolean dnd;

    public static @NonNull NotificationSettingsResponse from(@NonNull NotificationSettings s) {
        return NotificationSettingsResponse.builder()
                .checkupReminder(s.isCheckupReminder())
                .reportDone(s.isReportDone())
                .abnormalAlert(s.isAbnormalAlert())
                .tipsReminder(s.isTipsReminder())
                .weeklyReport(s.isWeeklyReport())
                .marketing(s.isMarketing())
                .dnd(s.isDnd())
                .build();
    }
}
