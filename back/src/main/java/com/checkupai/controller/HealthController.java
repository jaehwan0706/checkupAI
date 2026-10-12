package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Render 등 배포 플랫폼의 헬스체크용 — 인증 없이 접근 가능해야 한다 */
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/api/health")
    public @NonNull ApiResponse<Map<String, String>> health() {
        return ApiResponse.success(Map.of("status", "ok"));
    }

    // DB까지 왕복한다. 외부 모니터가 주기 호출하면 Supabase 무료 DB의 비활성 일시정지도 막고, DB 장애를 503으로 알린다.
    @GetMapping("/api/health/db")
    public ResponseEntity<ApiResponse<Map<String, String>>> healthDb() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok(ApiResponse.success(Map.of("status", "ok", "db", "up")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("DB 연결에 실패했습니다."));
        }
    }
}
