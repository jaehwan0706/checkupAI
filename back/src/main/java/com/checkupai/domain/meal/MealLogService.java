package com.checkupai.domain.meal;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.ai.ClaudeApiService;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.meal.MealLogResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MealLogService {

    private final MealLogRepository mealLogRepository;
    private final UserRepository userRepository;
    private final ClaudeApiService claudeApiService;

    @Value("${file.upload.path:uploads/meals}")
    private String uploadPath;

    @Transactional
    public @NonNull MealLogResponse saveTextMeal(
            @NonNull Long userId,
            @NonNull LocalDate date,
            @NonNull MealType mealType,
            @NonNull String content) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String aiAnalysis = null;
        try {
            aiAnalysis = claudeApiService.analyzeMealText(content);
        } catch (Exception e) {
            log.warn("식단 텍스트 AI 분석 실패 — 저장은 계속 진행", e);
        }

        return upsert(user, date, mealType, content, null, aiAnalysis);
    }

    @Transactional
    public @NonNull MealLogResponse saveImageMeal(
            @NonNull Long userId,
            @NonNull LocalDate date,
            @NonNull MealType mealType,
            @NonNull MultipartFile image) throws IOException {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String storedFilename = saveFile(image);
        String imageUrl = "/api/meals/image/" + storedFilename;

        String content = null;
        String aiAnalysis = null;
        try {
            byte[] bytes = image.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String mediaType = image.getContentType() != null ? image.getContentType() : "image/jpeg";
            String[] result = claudeApiService.analyzeFoodImage(base64, mediaType);
            content = result[0];
            aiAnalysis = result[1];
        } catch (Exception e) {
            log.warn("식단 이미지 AI 분석 실패 — 저장은 계속 진행", e);
        }

        return upsert(user, date, mealType, content, imageUrl, aiAnalysis);
    }

    @Transactional(readOnly = true)
    public @NonNull List<MealLogResponse> getByDate(@NonNull Long userId, @NonNull LocalDate date) {
        return mealLogRepository.findByUserIdAndLogDateOrderByMealType(userId, date)
                .stream()
                .map(MealLogResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public @NonNull List<MealLogResponse> getByMonth(@NonNull Long userId, @NonNull YearMonth month) {
        LocalDate from = month.atDay(1);
        LocalDate to = month.atEndOfMonth();
        return mealLogRepository.findByUserIdAndDateRange(userId, from, to)
                .stream()
                .map(MealLogResponse::from)
                .toList();
    }

    public long countThisWeek(@NonNull Long userId) {
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);
        return mealLogRepository.countByUserIdAndDateRange(userId, monday, sunday);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private MealLogResponse upsert(User user, LocalDate date, MealType mealType,
                                   String content, String imageUrl, String aiAnalysis) {
        Optional<MealLog> existing = mealLogRepository
                .findByUserIdAndLogDateAndMealType(user.getId(), date, mealType);

        MealLog log;
        if (existing.isPresent()) {
            log = existing.get();
            log.update(content, imageUrl, aiAnalysis);
        } else {
            log = MealLog.builder()
                    .user(user)
                    .logDate(date)
                    .mealType(mealType)
                    .content(content)
                    .imageUrl(imageUrl)
                    .aiAnalysis(aiAnalysis)
                    .build();
            mealLogRepository.save(log);
        }
        return MealLogResponse.from(log);
    }

    private String saveFile(MultipartFile file) throws IOException {
        Path dir = Paths.get(uploadPath);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
        String ext = "";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID() + ext;
        file.transferTo(dir.resolve(filename).toFile());
        return filename;
    }
}
