package com.checkupai.dto.goal;

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
}
