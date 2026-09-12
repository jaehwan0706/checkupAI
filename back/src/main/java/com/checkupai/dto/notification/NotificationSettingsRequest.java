package com.checkupai.dto.notification;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationSettingsRequest {
    private boolean checkupReminder;
    private boolean reportDone;
    private boolean abnormalAlert;
    private boolean tipsReminder;
    private boolean weeklyReport;
    private boolean marketing;
    private boolean dnd;
}
