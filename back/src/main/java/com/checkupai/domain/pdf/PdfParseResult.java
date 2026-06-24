package com.checkupai.domain.pdf;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class PdfParseResult {

    private LocalDate checkupDate;
    private Double height;
    private Double weight;
    private Double bmi;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Integer fastingBloodSugar;
    private Integer totalCholesterol;
    private Integer ldlCholesterol;
    private Integer hdlCholesterol;
    private Integer ast;
    private Integer alt;
    private Double creatinine;
    private boolean parsedSuccessfully;
    private String rawText;
}
