package com.checkupai.dto.medical;

import com.checkupai.domain.medical.MedicalRecord;
import com.checkupai.domain.medical.MedicalRecordType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MedicalRecordResponse {
    private Long id;
    private MedicalRecordType type;
    private String title;
    private String description;
    private LocalDate recordedDate;
    private LocalDateTime createdAt;

    public static @NonNull MedicalRecordResponse from(@NonNull MedicalRecord r) {
        return MedicalRecordResponse.builder()
                .id(r.getId())
                .type(r.getType())
                .title(r.getTitle())
                .description(r.getDescription())
                .recordedDate(r.getRecordedDate())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
