package com.checkupai.dto.medical;

import com.checkupai.domain.medical.MedicalRecordType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class MedicalRecordRequest {
    private MedicalRecordType type;
    private String title;
    private String description;
    private LocalDate recordedDate;
}
