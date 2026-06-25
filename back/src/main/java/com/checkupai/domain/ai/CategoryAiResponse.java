package com.checkupai.domain.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryAiResponse {
    private String summary;

    // Vitals
    private String trend;
    private String riskLevel;
    private String reason;

    // Pharmacy
    private List<MedicationItem> medications;
    private String interactions;

    // Hospital
    private String diagnosis;

    // Common
    private List<String> immediateActions;
    private List<String> monthlyGoals;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicationItem {
        private String name;
        private String purpose;
        private String caution;
    }
}
