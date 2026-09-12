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
public class LifestyleGuideResponse {
    private List<Tip> tips;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Tip {
        private String category;    // 혈당/혈압/콜레스테롤/간수치/전신 등
        private String severity;    // 위험/주의/정상
        private String title;       // 짧은 실천 제목
        private String reason;      // 왜 필요한지 (1문장)
        private List<String> steps; // 구체적으로 어떻게 실천하는지 (2~3개 스텝)
    }
}
