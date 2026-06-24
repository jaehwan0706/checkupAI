package com.checkupai.dto.goal;

import com.checkupai.domain.goal.UserGoal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoalItemDto {
    private String id;
    private String icon;
    private String title;
    private String detail;
    private int pct;
    private boolean ai;

    public static GoalItemDto from(UserGoal g) {
        return new GoalItemDto(g.getGoalKey(), g.getIcon(), g.getTitle(), g.getDetail(), g.getPct(), g.isAiRecommended());
    }
}
