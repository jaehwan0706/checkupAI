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
public class AiReportResponse {

    private Long reportId;
    private Integer healthScore;
    private String summary;
    private List<RiskItem> riskItems;
    private List<String> immediateActions;
    private List<String> monthlyGoals;
    private String nextCheckupRecommendation;
    private Boolean isPaid;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskItem {
        private String name;
        private String value;
        private String status;
        private String reason;
        private String action;
    }
}
