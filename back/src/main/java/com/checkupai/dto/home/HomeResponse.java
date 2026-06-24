package com.checkupai.dto.home;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HomeResponse {
    private LocalDate lastCheckupDate;
    private Integer healthScore;
    private List<HealthMetricDto> metrics;
    private int todayCompletionRate;
    private LocalDate birthDate;
}
