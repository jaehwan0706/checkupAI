package com.checkupai.dto.vitals;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class VitalsRequest {
    private Integer systolic;
    private Integer diastolic;
    private Integer bloodSugar;
    private String measuredAt;
    private String memo;
    private LocalDate recordedDate;
}
