package com.checkupai.domain.goal;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_goals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class UserGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String goalKey;
    private String icon;
    private String title;
    private String detail;
    private int pct;
    private boolean aiRecommended;

    @Enumerated(EnumType.STRING)
    private GoalType goalType;

    private Integer startValue;
    private Integer targetValue;

    // 운동 목표 구조화 필드 (goalType == BEHAVIORAL 일 때만 사용)
    private String exerciseType;
    private Integer frequencyPerWeek;
    private Integer durationMinutes;
    private String intensity;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public void update(String title, String detail, int pct) {
        this.title = title;
        this.detail = detail;
        this.pct = pct;
    }

    @Builder
    public UserGoal(User user, String goalKey, String icon, String title, String detail, int pct, boolean aiRecommended,
                    GoalType goalType, Integer startValue, Integer targetValue,
                    String exerciseType, Integer frequencyPerWeek, Integer durationMinutes, String intensity) {
        this.user = user;
        this.goalKey = goalKey;
        this.icon = icon;
        this.title = title;
        this.detail = detail;
        this.pct = pct;
        this.aiRecommended = aiRecommended;
        this.goalType = goalType;
        this.startValue = startValue;
        this.targetValue = targetValue;
        this.exerciseType = exerciseType;
        this.frequencyPerWeek = frequencyPerWeek;
        this.durationMinutes = durationMinutes;
        this.intensity = intensity;
    }
}
