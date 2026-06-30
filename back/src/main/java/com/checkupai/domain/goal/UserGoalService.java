package com.checkupai.domain.goal;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.meal.MealLogRepository;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.domain.vitals.Vitals;
import com.checkupai.domain.vitals.VitalsRepository;
import com.checkupai.dto.goal.GoalItemDto;
import com.checkupai.dto.goal.GoalSaveRequest;
import com.checkupai.dto.goal.GoalUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserGoalService {

    private static final Pattern NUMERIC_RANGE_PATTERN = Pattern.compile("(\\d+)\\s*→\\s*(\\d+)");
    private static final Pattern WEEKLY_TARGET_PATTERN  = Pattern.compile("주\\s*(\\d+)\\s*회");

    private final UserGoalRepository goalRepository;
    private final UserRepository userRepository;
    private final VitalsRepository vitalsRepository;
    private final GoalCheckInRepository checkInRepository;
    private final MealLogRepository mealLogRepository;

    @Transactional(readOnly = true)
    public @NonNull List<GoalItemDto> findAll(@NonNull Long userId) {
        List<UserGoal> goals = goalRepository.findByUserIdOrderByIdAsc(userId);
        if (goals.isEmpty()) return List.of();

        // 수치형 목표용: 혈당이 있는 가장 최근 Vitals 조회
        Integer latestBloodSugar = vitalsRepository
                .findFirstByUserIdAndBloodSugarIsNotNullOrderByRecordedDateDescCreatedAtDesc(userId)
                .map(Vitals::getBloodSugar)
                .orElse(null);

        // 행동형 목표용: 이번 주 월요일부터 오늘까지 체크인 횟수를 goalId별 집계
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate today  = LocalDate.now();
        Map<Long, Long> weeklyCountByGoalId = checkInRepository
                .countByUserAndDateRange(userId, monday, today)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        // 식단형 목표용: 이번 주 (월~일) 식단 기록 횟수
        LocalDate sunday = monday.plusDays(6);
        long weeklyMealCount = mealLogRepository.countByUserIdAndDateRange(userId, monday, sunday);

        return goals.stream()
                .map(g -> GoalItemDto.from(g, computePct(g, latestBloodSugar, weeklyCountByGoalId, weeklyMealCount)))
                .toList();
    }

    @Transactional
    public @NonNull List<GoalItemDto> saveAll(@NonNull Long userId, @NonNull GoalSaveRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 체크인 먼저 삭제 (FK 제약 방지)
        checkInRepository.deleteAllByGoalUserId(userId);
        goalRepository.deleteAllByUserId(userId);

        List<UserGoal> goals = request.getGoals().stream()
                .map(dto -> {
                    GoalType type = inferGoalType(dto.getId(), dto.getDetail());
                    return UserGoal.builder()
                            .user(user)
                            .goalKey(dto.getId())
                            .icon(dto.getIcon())
                            .title(dto.getTitle())
                            .detail(dto.getDetail())
                            .pct(dto.getPct())
                            .aiRecommended(dto.isAi())
                            .goalType(type)
                            .startValue(type == GoalType.NUMERIC ? parseStartValue(dto.getDetail()) : null)
                            .targetValue(type == GoalType.NUMERIC ? parseTargetValue(dto.getDetail()) : null)
                            .exerciseType(dto.getExerciseType())
                            .frequencyPerWeek(dto.getFrequencyPerWeek())
                            .durationMinutes(dto.getDurationMinutes())
                            .intensity(dto.getIntensity())
                            .build();
                })
                .toList();

        return goalRepository.saveAll(goals).stream()
                .map(GoalItemDto::from)
                .toList();
    }

    @Transactional
    public @NonNull GoalItemDto updateGoal(@NonNull Long userId, @NonNull Long goalId, @NonNull GoalUpdateRequest request) {
        UserGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.GOAL_NOT_FOUND));
        goal.update(request.getTitle(), request.getDetail(), request.getPct());
        return GoalItemDto.from(goal);
    }

    @Transactional
    public void deleteGoal(@NonNull Long userId, @NonNull Long goalId) {
        UserGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.GOAL_NOT_FOUND));
        goalRepository.delete(goal);
    }

    // ── 진행률 계산 ──────────────────────────────────────────────────────────

    private int computePct(UserGoal g, Integer latestBloodSugar, Map<Long, Long> weeklyCount, long weeklyMealCount) {
        if (g.getGoalType() == GoalType.NUMERIC) {
            if (latestBloodSugar == null || g.getStartValue() == null || g.getTargetValue() == null) {
                return g.getPct();
            }
            int range = g.getStartValue() - g.getTargetValue();
            if (range == 0) return 100;
            int progress = g.getStartValue() - latestBloodSugar;
            return Math.max(0, Math.min(100, (int) Math.round((double) progress / range * 100)));
        } else if (g.getGoalType() == GoalType.DIETARY) {
            // 3끼 × 7일 = 21 기준
            return Math.min(100, (int) Math.round((double) weeklyMealCount / 21 * 100));
        } else {
            // BEHAVIORAL (null goalType 포함 — 기존 데이터 호환)
            int weeklyTarget = parseWeeklyTarget(g.getDetail());
            long checkIns = weeklyCount.getOrDefault(g.getId(), 0L);
            return Math.min(100, (int) Math.round((double) checkIns / weeklyTarget * 100));
        }
    }

    // ── goalType 추론 ─────────────────────────────────────────────────────────

    private GoalType inferGoalType(String goalKey, String detail) {
        if (goalKey != null) {
            String key = goalKey.toLowerCase();
            if (key.contains("blood") || key.contains("sugar") || key.contains("glucose")
                    || key.contains("혈당") || key.contains("혈압")) {
                return GoalType.NUMERIC;
            }
            if (key.contains("food") || key.contains("diet") || key.contains("meal")
                    || key.contains("식") || key.contains("음식") || key.contains("영양")) {
                return GoalType.DIETARY;
            }
        }
        if (detail != null && NUMERIC_RANGE_PATTERN.matcher(detail).find()) {
            return GoalType.NUMERIC;
        }
        return GoalType.BEHAVIORAL;
    }

    private Integer parseStartValue(String detail) {
        if (detail == null) return null;
        Matcher m = Pattern.compile("(\\d+)\\s*→").matcher(detail);
        return m.find() ? Integer.parseInt(m.group(1)) : null;
    }

    private Integer parseTargetValue(String detail) {
        if (detail == null) return null;
        Matcher m = Pattern.compile("→\\s*(\\d+)").matcher(detail);
        return m.find() ? Integer.parseInt(m.group(1)) : null;
    }

    private int parseWeeklyTarget(String detail) {
        if (detail == null) return 7;
        Matcher m = WEEKLY_TARGET_PATTERN.matcher(detail);
        return m.find() ? Integer.parseInt(m.group(1)) : 7;
    }
}
