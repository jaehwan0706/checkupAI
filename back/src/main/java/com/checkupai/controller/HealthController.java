package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Render 등 배포 플랫폼의 헬스체크용 — 인증 없이 접근 가능해야 한다 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public @NonNull ApiResponse<Map<String, String>> health() {
        return ApiResponse.success(Map.of("status", "ok"));
    }
}
