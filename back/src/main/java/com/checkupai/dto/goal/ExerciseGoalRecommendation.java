package com.checkupai.dto.goal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseGoalRecommendation {
    private String title;
    private String detail;
    private String exerciseType;
    private Integer frequencyPerWeek;
    private Integer durationMinutes;
    private String intensity;
    private String reason;
}
