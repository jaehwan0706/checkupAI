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
    private String summary;
    private List<DetailItem> details;
    private Lifestyle lifestyle;
    private Boolean isPaid;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailItem {
        private String item;
        private String value;
        private String status;
        private String explanation;
        private String advice;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Lifestyle {
        private String food;
        private String exercise;
        private String sleep;
    }
}
