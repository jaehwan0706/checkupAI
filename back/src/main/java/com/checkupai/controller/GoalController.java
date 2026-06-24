package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.goal.UserGoalService;
import com.checkupai.dto.goal.GoalItemDto;
import com.checkupai.dto.goal.GoalSaveRequest;
import com.checkupai.dto.goal.GoalUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final UserGoalService goalService;

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
}
