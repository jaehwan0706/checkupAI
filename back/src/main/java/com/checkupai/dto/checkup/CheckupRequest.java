package com.checkupai.dto.checkup;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class CheckupRequest {

    @NotNull(message = "검진 날짜를 입력해주세요.")
    private LocalDate checkupDate;

    @NotNull(message = "키를 입력해주세요.")
    private Double height;

    @NotNull(message = "몸무게를 입력해주세요.")
    private Double weight;

    private Integer systolicBp;
    private Integer diastolicBp;
    private Integer fastingBloodSugar;
    private Integer totalCholesterol;
    private Integer ldlCholesterol;
    private Integer hdlCholesterol;
    private Integer ast;
    private Integer alt;
    private Double creatinine;
}
