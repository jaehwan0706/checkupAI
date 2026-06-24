package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.checkup.HealthCheckupService;
import com.checkupai.dto.checkup.CheckupRequest;
import com.checkupai.dto.checkup.CheckupResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkup")
@RequiredArgsConstructor
public class CheckupController {

    private final HealthCheckupService checkupService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<CheckupResponse> create(
            @AuthenticationPrincipal @NonNull Long userId,
            @Valid @RequestBody @NonNull CheckupRequest request) {
        return ApiResponse.success(checkupService.save(userId, request), "검진 기록이 저장되었습니다.");
    }

    @GetMapping
    public @NonNull ApiResponse<List<CheckupResponse>> getAll(@AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(checkupService.findAll(userId));
    }

    @GetMapping("/{id}")
    public @NonNull ApiResponse<CheckupResponse> getOne(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long id) {
        return ApiResponse.success(checkupService.findById(userId, id));
    }
    @GetMapping("/latest")
    public @NonNull ApiResponse<CheckupResponse> getLatest(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(checkupService.findLatest(userId));
    }

    @GetMapping("/history")
    public @NonNull ApiResponse<List<CheckupResponse>> getHistory(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(checkupService.findAll(userId)); 
    }
}