package com.checkupai.dto.goal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DietaryGoalRecommendation {
    private String title;
    private String detail;
    private String reason;
}
