package com.checkupai.domain.ai;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.checkup.HealthCheckupRepository;
import com.checkupai.domain.report.AiReport;
import com.checkupai.domain.report.AiReportRepository;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiReportService {

    private final HealthCheckupRepository checkupRepository;
    private final AiReportRepository aiReportRepository;
    private final UserRepository userRepository;
    private final ClaudeApiService claudeApiService;
    private final ObjectMapper objectMapper;

    @Transactional
    public @NonNull AiReportResponse analyze(@NonNull Long userId, @NonNull Long checkupId) {
        HealthCheckup checkup = checkupRepository.findByIdAndUserId(checkupId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHECKUP_NOT_FOUND));

        // 이미 생성된 리포트가 있으면 재사용
        return aiReportRepository.findByCheckupIdAndUserId(checkupId, userId)
                .map(this::toResponse)
                .orElseGet(() -> {
                    String reportContent = claudeApiService.analyze(checkup);

                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

                    AiReport saved = aiReportRepository.save(
                            AiReport.builder()
                                    .user(user)
                                    .checkup(checkup)
                                    .reportContent(reportContent)
                                    .isPaid(user.hasAnnualPass())
                                    .build()
                    );
                    return toResponse(saved);
                });
    }

    @Transactional(readOnly = true)
    public @NonNull AiReportResponse getReport(@NonNull Long userId, @NonNull Long checkupId) {
        AiReport report = aiReportRepository.findByCheckupIdAndUserId(checkupId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_REPORT_NOT_FOUND));
        return toResponse(report);
    }

    private @NonNull AiReportResponse toResponse(@NonNull AiReport report) {
        try {
            AiAnalysisResult result = objectMapper.readValue(report.getReportContent(), AiAnalysisResult.class);
            boolean paid = Boolean.TRUE.equals(report.getIsPaid());
            return AiReportResponse.builder()
                    .reportId(report.getId())
                    .summary(result.getSummary())
                    .details(paid ? result.getDetails() : null)
                    .lifestyle(paid ? result.getLifestyle() : null)
                    .isPaid(report.getIsPaid())
                    .build();
        } catch (JsonProcessingException e) {
            log.error("AI 리포트 파싱 실패 reportId={}", report.getId(), e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
