package com.checkupai.domain.ai;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.checkup.HealthCheckupRepository;
import com.checkupai.domain.daily.DailyRecord;
import com.checkupai.domain.daily.DailyRecordRepository;
import com.checkupai.domain.medical.MedicalRecord;
import com.checkupai.domain.medical.MedicalRecordRepository;
import com.checkupai.domain.medical.MedicalRecordType;
import com.checkupai.domain.vitals.Vitals;
import com.checkupai.domain.vitals.VitalsRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiReportService {

    private final HealthCheckupRepository checkupRepository;
    private final AiReportRepository aiReportRepository;
    private final UserRepository userRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final VitalsRepository vitalsRepository;
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
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

                    List<DailyRecord> dailyRecords = dailyRecordRepository
                            .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
                                    userId, LocalDate.now().minusDays(6), LocalDate.now());

                    List<MedicalRecord> allMedical = medicalRecordRepository.findAllByUserId(userId);
                    List<MedicalRecord> medicalRecords = allMedical.size() > 5
                            ? allMedical.subList(0, 5) : allMedical;

                    String reportContent = claudeApiService.analyze(checkup, user, dailyRecords, medicalRecords);

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

    @Transactional(readOnly = true)
    public @NonNull CategoryAiResponse analyzeVitals(@NonNull Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        List<Vitals> vitals = vitalsRepository.findAllByUserId(userId);
        if (vitals.isEmpty()) throw new CustomException(ErrorCode.NO_RECORDS);
        return claudeApiService.analyzeVitals(user, vitals);
    }

    @Transactional(readOnly = true)
    public @NonNull CategoryAiResponse analyzeMedical(@NonNull Long userId, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        List<MedicalRecord> all = medicalRecordRepository.findAllByUserId(userId);
        List<MedicalRecord> medicals = (type != null && !type.isBlank())
                ? all.stream()
                     .filter(m -> m.getType() == MedicalRecordType.valueOf(type))
                     .collect(Collectors.toList())
                : all;
        if (medicals.isEmpty()) throw new CustomException(ErrorCode.NO_RECORDS);
        return claudeApiService.analyzeMedical(user, medicals, type);
    }

    private @NonNull AiReportResponse toResponse(@NonNull AiReport report) {
        try {
            AiAnalysisResult result = objectMapper.readValue(report.getReportContent(), AiAnalysisResult.class);
            return AiReportResponse.builder()
                    .reportId(report.getId())
                    .healthScore(result.getHealthScore())
                    .summary(result.getSummary())
                    .riskItems(result.getRiskItems())
                    .immediateActions(result.getImmediateActions())
                    .monthlyGoals(result.getMonthlyGoals())
                    .nextCheckupRecommendation(result.getNextCheckupRecommendation())
                    .isPaid(report.getIsPaid())
                    .build();
        } catch (JsonProcessingException e) {
            log.error("AI 리포트 파싱 실패 reportId={}", report.getId(), e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
