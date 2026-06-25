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
    private List<DetailItem> details;
    private List<String> lifestyleGuides;
    private String advice;
    private String nextCheckup;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailItem {
        private String title;
        private String content;
    }
}
