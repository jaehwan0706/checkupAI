package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.guide.GuideCheckInService;
import com.checkupai.domain.guide.GuideCheckInStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guide")
@RequiredArgsConstructor
public class GuideCheckInController {

    private final GuideCheckInService guideCheckInService;

    @GetMapping("/checkins")
    public @NonNull ApiResponse<List<GuideCheckInStatus>> getStatus(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(guideCheckInService.getStatus(userId));
    }

    @PostMapping("/checkins")
    public @NonNull ApiResponse<GuideCheckInStatus> toggle(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam @NonNull String category) {
        GuideCheckInStatus status = guideCheckInService.toggle(userId, category);
        return ApiResponse.success(status, status.isCheckedToday() ? "오늘 실천을 기록했어요" : "체크를 취소했어요");
    }
}
