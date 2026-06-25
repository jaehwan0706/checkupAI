package com.checkupai.domain.ai;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AiAnalysisResult {
    private Integer healthScore;
    private String summary;
    private List<AiReportResponse.RiskItem> riskItems;
    private List<String> immediateActions;
    private List<String> monthlyGoals;
    private String nextCheckupRecommendation;
}
