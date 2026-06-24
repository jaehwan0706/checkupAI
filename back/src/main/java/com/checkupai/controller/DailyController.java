package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.daily.DailyRecordService;
import com.checkupai.dto.daily.DailyRequest;
import com.checkupai.dto.daily.DailyResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily")
@RequiredArgsConstructor
public class DailyController {

    private final DailyRecordService dailyRecordService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<DailyResponse> create(
            @AuthenticationPrincipal @NonNull Long userId,
            @Valid @RequestBody @NonNull DailyRequest request) {
        return ApiResponse.success(dailyRecordService.save(userId, request), "일상 기록이 저장되었습니다.");
    }

    @GetMapping
    public @NonNull ApiResponse<List<DailyResponse>> getRecent(@AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(dailyRecordService.findRecent30Days(userId));
    }

    @GetMapping("/{date}")
    public @NonNull ApiResponse<DailyResponse> getByDate(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @NonNull LocalDate date) {
        return ApiResponse.success(dailyRecordService.findByDate(userId, date));
    }
}
