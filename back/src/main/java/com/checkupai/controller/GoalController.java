package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.goal.GoalCheckInService;
import com.checkupai.domain.goal.UserGoalService;
import com.checkupai.dto.goal.GoalItemDto;
import com.checkupai.dto.goal.GoalSaveRequest;
import com.checkupai.dto.goal.GoalUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final UserGoalService goalService;
    private final GoalCheckInService checkInService;

    @GetMapping
    public @NonNull ApiResponse<List<GoalItemDto>> getGoals(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(goalService.findAll(userId));
    }

    @PostMapping
    public @NonNull ApiResponse<List<GoalItemDto>> saveGoals(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestBody @NonNull GoalSaveRequest request) {
        return ApiResponse.success(goalService.saveAll(userId, request), "건강 목표가 저장되었어요");
    }

    @PutMapping("/{id}")
    public @NonNull ApiResponse<GoalItemDto> updateGoal(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long id,
            @RequestBody @NonNull GoalUpdateRequest request) {
        return ApiResponse.success(goalService.updateGoal(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public @NonNull ApiResponse<Void> deleteGoal(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long id) {
        goalService.deleteGoal(userId, id);
        return ApiResponse.success(null, "건강 목표가 삭제되었어요");
    }

    // ── 체크인 ──────────────────────────────────────────────────────────────

    @PostMapping("/{goalId}/checkin")
    public @NonNull ApiResponse<Map<String, Object>> toggleCheckIn(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long goalId) {
        boolean checked = checkInService.toggle(userId, goalId);
        return ApiResponse.success(
                Map.of("checked", checked),
                checked ? "오늘 체크인 완료" : "체크인 취소"
        );
    }

    @GetMapping("/{goalId}/checkins")
    public @NonNull ApiResponse<List<String>> getMonthlyCheckIns(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long goalId,
            @RequestParam(defaultValue = "") String month) {
        YearMonth ym = month.isBlank() ? YearMonth.now() : YearMonth.parse(month);
        List<String> dates = checkInService.getMonthlyCheckIns(userId, goalId, ym)
                .stream()
                .map(java.time.LocalDate::toString)
                .toList();
        return ApiResponse.success(dates, "체크인 조회 완료");
    }
}
