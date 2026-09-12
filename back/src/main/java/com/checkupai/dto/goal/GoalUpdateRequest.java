package com.checkupai.dto.goal;

import com.checkupai.domain.goal.GoalType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GoalUpdateRequest {
    private String title;
    private String detail;
    private int pct;
    private GoalType goalType;
    private Integer startValue;
    private Integer targetValue;
    private String exerciseType;
    private Integer frequencyPerWeek;
    private Integer durationMinutes;
    private String intensity;
}
