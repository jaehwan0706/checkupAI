package com.checkupai.domain.daily;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class DailyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate recordDate;
    private String mealBreakfast;
    private String mealLunch;
    private String mealDinner;
    private String exerciseType;
    private Integer exerciseMinutes;
    private Double sleepHours;

    @Enumerated(EnumType.STRING)
    private SleepQuality sleepQuality;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public DailyRecord(User user, LocalDate recordDate, String mealBreakfast, String mealLunch, String mealDinner,
                       String exerciseType, Integer exerciseMinutes, Double sleepHours, SleepQuality sleepQuality) {
        this.user = user;
        this.recordDate = recordDate;
        this.mealBreakfast = mealBreakfast;
        this.mealLunch = mealLunch;
        this.mealDinner = mealDinner;
        this.exerciseType = exerciseType;
        this.exerciseMinutes = exerciseMinutes;
        this.sleepHours = sleepHours;
        this.sleepQuality = sleepQuality;
    }

    public void update(String mealBreakfast, String mealLunch, String mealDinner,
                       String exerciseType, Integer exerciseMinutes, Double sleepHours, SleepQuality sleepQuality) {
        this.mealBreakfast = mealBreakfast;
        this.mealLunch = mealLunch;
        this.mealDinner = mealDinner;
        this.exerciseType = exerciseType;
        this.exerciseMinutes = exerciseMinutes;
        this.sleepHours = sleepHours;
        this.sleepQuality = sleepQuality;
    }
}
