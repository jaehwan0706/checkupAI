package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.meal.MealLogService;
import com.checkupai.domain.meal.MealType;
import com.checkupai.dto.meal.MealLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealLogController {

    private final MealLogService mealLogService;

    /** 텍스트 식단 기록 */
    @PostMapping
    public @NonNull ApiResponse<MealLogResponse> saveTextMeal(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam @NonNull String date,
            @RequestParam @NonNull String mealType,
            @RequestParam @NonNull String content) {

        MealLogResponse response = mealLogService.saveTextMeal(
                userId,
                LocalDate.parse(date),
                MealType.valueOf(mealType.toUpperCase()),
                content
        );
        return ApiResponse.success(response, "식단이 기록되었어요");
    }

    /** 이미지 식단 기록 */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public @NonNull ApiResponse<MealLogResponse> saveImageMeal(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam @NonNull String date,
            @RequestParam @NonNull String mealType,
            @RequestParam("file") @NonNull MultipartFile file) throws IOException {

        MealLogResponse response = mealLogService.saveImageMeal(
                userId,
                LocalDate.parse(date),
                MealType.valueOf(mealType.toUpperCase()),
                file
        );
        return ApiResponse.success(response, "식단 이미지가 기록되었어요");
    }

    /** 특정 날짜 식단 조회 */
    @GetMapping
    public @NonNull ApiResponse<List<MealLogResponse>> getMeals(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String month) {

        if (date != null) {
            return ApiResponse.success(mealLogService.getByDate(userId, LocalDate.parse(date)));
        }
        YearMonth ym = month != null ? YearMonth.parse(month) : YearMonth.now();
        return ApiResponse.success(mealLogService.getByMonth(userId, ym));
    }

    /** 업로드된 식단 이미지 서빙 */
    @GetMapping("/image/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable @NonNull String filename) {
        try {
            Path filePath = Paths.get("uploads/meals").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
