package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.medical.MedicalRecordService;
import com.checkupai.dto.medical.MedicalRecordRequest;
import com.checkupai.dto.medical.MedicalRecordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<MedicalRecordResponse> create(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestBody @NonNull MedicalRecordRequest request) {
        return ApiResponse.success(medicalRecordService.save(userId, request));
    }

    @GetMapping("/history")
    public @NonNull ApiResponse<List<MedicalRecordResponse>> getHistory(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(medicalRecordService.findAll(userId));
    }
}
