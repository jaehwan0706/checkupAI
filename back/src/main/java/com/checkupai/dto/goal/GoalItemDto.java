package com.checkupai.dto.goal;

import com.checkupai.domain.goal.GoalType;
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
    private Long dbId;      // DB 기본 키 — 체크인 API 호출 시 사용
    private String id;
    private String icon;
    private String title;
    private String detail;
    private int pct;
    private boolean ai;
    private GoalType goalType;
    private Integer startValue;
    private Integer targetValue;

    public static GoalItemDto from(UserGoal g) {
        return new GoalItemDto(g.getId(), g.getGoalKey(), g.getIcon(), g.getTitle(), g.getDetail(),
                g.getPct(), g.isAiRecommended(), g.getGoalType(), g.getStartValue(), g.getTargetValue());
    }

    public static GoalItemDto from(UserGoal g, int computedPct) {
        return new GoalItemDto(g.getId(), g.getGoalKey(), g.getIcon(), g.getTitle(), g.getDetail(),
                computedPct, g.isAiRecommended(), g.getGoalType(), g.getStartValue(), g.getTargetValue());
    }
}
