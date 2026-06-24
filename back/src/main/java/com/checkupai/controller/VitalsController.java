package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.vitals.VitalsService;
import com.checkupai.dto.vitals.VitalsRequest;
import com.checkupai.dto.vitals.VitalsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vitals")
@RequiredArgsConstructor
public class VitalsController {

    private final VitalsService vitalsService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<VitalsResponse> create(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestBody @NonNull VitalsRequest request) {
        return ApiResponse.success(vitalsService.save(userId, request));
    }

    @GetMapping
    public @NonNull ApiResponse<List<VitalsResponse>> getRecent(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(vitalsService.findRecent(userId));
    }

    @GetMapping("/history")
    public @NonNull ApiResponse<List<VitalsResponse>> getHistory(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(vitalsService.findAll(userId));
    }
}
