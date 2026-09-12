package com.checkupai.domain.notification;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private boolean checkupReminder;

    @Column(nullable = false)
    private boolean reportDone;

    @Column(nullable = false)
    private boolean abnormalAlert;

    @Column(nullable = false)
    private boolean tipsReminder;

    @Column(nullable = false)
    private boolean weeklyReport;

    @Column(nullable = false)
    private boolean marketing;

    @Column(nullable = false)
    private boolean dnd;

    @Builder
    public NotificationSettings(Long userId, boolean checkupReminder, boolean reportDone,
                                 boolean abnormalAlert, boolean tipsReminder, boolean weeklyReport,
                                 boolean marketing, boolean dnd) {
        this.userId = userId;
        this.checkupReminder = checkupReminder;
        this.reportDone = reportDone;
        this.abnormalAlert = abnormalAlert;
        this.tipsReminder = tipsReminder;
        this.weeklyReport = weeklyReport;
        this.marketing = marketing;
        this.dnd = dnd;
    }

    public static NotificationSettings defaultsFor(Long userId) {
        return NotificationSettings.builder()
                .userId(userId)
                .checkupReminder(true)
                .reportDone(true)
                .abnormalAlert(true)
                .tipsReminder(true)
                .weeklyReport(false)
                .marketing(false)
                .dnd(false)
                .build();
    }

    public void update(boolean checkupReminder, boolean reportDone, boolean abnormalAlert,
                        boolean tipsReminder, boolean weeklyReport, boolean marketing, boolean dnd) {
        this.checkupReminder = checkupReminder;
        this.reportDone = reportDone;
        this.abnormalAlert = abnormalAlert;
        this.tipsReminder = tipsReminder;
        this.weeklyReport = weeklyReport;
        this.marketing = marketing;
        this.dnd = dnd;
    }
}
