package com.checkupai.dto.daily;

import com.checkupai.domain.daily.SleepQuality;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class DailyRequest {

    @NotNull(message = "날짜를 입력해주세요.")
    private LocalDate recordDate;

    private String mealBreakfast;
    private String mealLunch;
    private String mealDinner;
    private String exerciseType;
    private Integer exerciseMinutes;
    private Double sleepHours;
    private SleepQuality sleepQuality;
}
