package com.checkupai.domain.ai;

import com.checkupai.common.ApiResponse;
import com.checkupai.dto.goal.ExerciseGoalRecommendation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiReportService aiReportService;

    @PostMapping("/analyze")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<AiReportResponse> analyze(
            @AuthenticationPrincipal @NonNull Long userId,
            @Valid @RequestBody @NonNull AnalyzeRequest request) {
        return ApiResponse.success(
                aiReportService.analyze(userId, request.getCheckupId()),
                "AI 분석이 완료되었습니다.");
    }

    @GetMapping("/report/{checkupId}")
    public @NonNull ApiResponse<AiReportResponse> getReport(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long checkupId) {
        return ApiResponse.success(aiReportService.getReport(userId, checkupId));
    }

    @PostMapping("/analyze/daily")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<CategoryAiResponse> analyzeDaily(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(aiReportService.analyzeVitals(userId), "혈압·혈당 AI 분석이 완료되었습니다.");
    }

    @PostMapping("/analyze/medical")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<CategoryAiResponse> analyzeMedical(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam(required = false) String type) {
        return ApiResponse.success(aiReportService.analyzeMedical(userId, type), "진료·처방 AI 분석이 완료되었습니다.");
    }

    @PostMapping("/goals/exercise")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<ExerciseGoalRecommendation> recommendExerciseGoal(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(
                aiReportService.recommendExerciseGoal(userId),
                "운동 목표 추천이 완료되었습니다.");
    }

    @Getter
    static class AnalyzeRequest {
        @NotNull(message = "검진 ID를 입력해주세요.")
        private Long checkupId;
    }
}
