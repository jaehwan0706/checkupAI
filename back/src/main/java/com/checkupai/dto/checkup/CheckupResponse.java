package com.checkupai.dto.checkup;

import com.checkupai.domain.checkup.HealthCheckup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CheckupResponse {

    private Long id;
    private LocalDate checkupDate;
    private Double height;
    private Double weight;
    private Double bmi;
    private Integer healthScore;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Integer fastingBloodSugar;
    private Integer totalCholesterol;
    private Integer ldlCholesterol;
    private Integer hdlCholesterol;
    private Integer ast;
    private Integer alt;
    private Double creatinine;
    private LocalDateTime createdAt;

    public static @NonNull CheckupResponse from(@NonNull HealthCheckup c) {
        return CheckupResponse.builder()
                .id(c.getId())
                .checkupDate(c.getCheckupDate())
                .height(c.getHeight())
                .weight(c.getWeight())
                .bmi(c.getBmi())
                .healthScore(c.getHealthScore())
                .systolicBp(c.getSystolicBp())
                .diastolicBp(c.getDiastolicBp())
                .fastingBloodSugar(c.getFastingBloodSugar())
                .totalCholesterol(c.getTotalCholesterol())
                .ldlCholesterol(c.getLdlCholesterol())
                .hdlCholesterol(c.getHdlCholesterol())
                .ast(c.getAst())
                .alt(c.getAlt())
                .creatinine(c.getCreatinine())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
