package com.checkupai.dto.meal;

import com.checkupai.domain.meal.MealLog;
import com.checkupai.domain.meal.MealType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class MealLogResponse {
    private Long id;
    private LocalDate logDate;
    private MealType mealType;
    private String content;
    private String imageUrl;
    private String aiAnalysis;

    public static MealLogResponse from(MealLog m) {
        return new MealLogResponse(
                m.getId(),
                m.getLogDate(),
                m.getMealType(),
                m.getContent(),
                m.getImageUrl(),
                m.getAiAnalysis()
        );
    }
}
