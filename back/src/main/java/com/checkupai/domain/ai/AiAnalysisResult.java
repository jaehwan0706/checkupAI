package com.checkupai.domain.ai;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AiAnalysisResult {
    private String summary;
    private List<AiReportResponse.DetailItem> details;
    private AiReportResponse.Lifestyle lifestyle;
}
