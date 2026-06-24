package com.checkupai.dto.vitals;

import com.checkupai.domain.vitals.Vitals;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class VitalsResponse {
    private Long id;
    private Integer systolic;
    private Integer diastolic;
    private Integer bloodSugar;
    private String measuredAt;
    private String memo;
    private LocalDate recordedDate;
    private LocalDateTime createdAt;

    public static @NonNull VitalsResponse from(@NonNull Vitals v) {
        return VitalsResponse.builder()
                .id(v.getId())
                .systolic(v.getSystolic())
                .diastolic(v.getDiastolic())
                .bloodSugar(v.getBloodSugar())
                .measuredAt(v.getMeasuredAt())
                .memo(v.getMemo())
                .recordedDate(v.getRecordedDate())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
