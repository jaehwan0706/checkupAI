package com.checkupai.domain.guide;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class GuideCheckInStatus {
    private String category;
    private boolean checkedToday;
    private int streak;
}
