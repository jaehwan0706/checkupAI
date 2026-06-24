package com.checkupai.dto.home;

import com.checkupai.common.HealthStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HealthMetricDto {
    private String name;
    private String value;
    private HealthStatus status;
}
