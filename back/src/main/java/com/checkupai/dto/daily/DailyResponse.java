package com.checkupai.dto.daily;

import com.checkupai.domain.daily.DailyRecord;
import com.checkupai.domain.daily.SleepQuality;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class DailyResponse {

    private Long id;
    private LocalDate recordDate;
    private String mealBreakfast;
    private String mealLunch;
    private String mealDinner;
    private String exerciseType;
    private Integer exerciseMinutes;
    private Double sleepHours;
    private SleepQuality sleepQuality;
    private LocalDateTime createdAt;

    public static @NonNull DailyResponse from(@NonNull DailyRecord r) {
        return DailyResponse.builder()
                .id(r.getId())
                .recordDate(r.getRecordDate())
                .mealBreakfast(r.getMealBreakfast())
                .mealLunch(r.getMealLunch())
                .mealDinner(r.getMealDinner())
                .exerciseType(r.getExerciseType())
                .exerciseMinutes(r.getExerciseMinutes())
                .sleepHours(r.getSleepHours())
                .sleepQuality(r.getSleepQuality())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
