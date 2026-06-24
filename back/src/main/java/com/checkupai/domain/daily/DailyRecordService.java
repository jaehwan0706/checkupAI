package com.checkupai.domain.daily;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.daily.DailyRequest;
import com.checkupai.dto.daily.DailyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DailyRecordService {

    private final DailyRecordRepository dailyRecordRepository;
    private final UserRepository userRepository;

    @Transactional
    public @NonNull DailyResponse save(@NonNull Long userId, @NonNull DailyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 같은 날짜에 기록이 이미 있으면 덮어쓰기 (upsert)
        return dailyRecordRepository.findByUserIdAndRecordDate(userId, request.getRecordDate())
                .map(existing -> {
                    existing.update(
                            request.getMealBreakfast(), request.getMealLunch(), request.getMealDinner(),
                            request.getExerciseType(), request.getExerciseMinutes(),
                            request.getSleepHours(), request.getSleepQuality());
                    return DailyResponse.from(dailyRecordRepository.save(existing));
                })
                .orElseGet(() -> {
                    DailyRecord record = DailyRecord.builder()
                            .user(user)
                            .recordDate(request.getRecordDate())
                            .mealBreakfast(request.getMealBreakfast())
                            .mealLunch(request.getMealLunch())
                            .mealDinner(request.getMealDinner())
                            .exerciseType(request.getExerciseType())
                            .exerciseMinutes(request.getExerciseMinutes())
                            .sleepHours(request.getSleepHours())
                            .sleepQuality(request.getSleepQuality())
                            .build();
                    return DailyResponse.from(dailyRecordRepository.save(record));
                });
    }

    @Transactional(readOnly = true)
    public @NonNull List<DailyResponse> findRecent30Days(@NonNull Long userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(30);
        return dailyRecordRepository
                .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, start, end).stream()
                .map(DailyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public @NonNull DailyResponse findByDate(@NonNull Long userId, @NonNull LocalDate date) {
        return dailyRecordRepository.findByUserIdAndRecordDate(userId, date)
                .map(DailyResponse::from)
                .orElseThrow(() -> new CustomException(ErrorCode.DAILY_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Optional<DailyRecord> findToday(@NonNull Long userId) {
        return dailyRecordRepository.findByUserIdAndRecordDate(userId, LocalDate.now());
    }
}
