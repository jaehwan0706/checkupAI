package com.checkupai.domain.guide;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GuideCheckInService {

    // 검진 수치 분석 시 사용하는 카테고리와 동일 (GeminiApiService의 맞춤 가이드 프롬프트 참고)
    public static final List<String> CATEGORIES = List.of("혈당", "혈압", "콜레스테롤", "간수치", "전신");
    private static final int STREAK_LOOKBACK_DAYS = 90;

    private final GuideCheckInRepository checkInRepository;
    private final UserRepository userRepository;

    @Transactional
    public @NonNull GuideCheckInStatus toggle(@NonNull Long userId, @NonNull String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        LocalDate today = LocalDate.now();
        Optional<GuideCheckIn> existing = checkInRepository.findByUserIdAndCategoryAndCheckedDate(userId, category, today);
        if (existing.isPresent()) {
            checkInRepository.delete(existing.get());
        } else {
            checkInRepository.save(GuideCheckIn.builder().user(user).category(category).checkedDate(today).build());
        }

        boolean checkedToday = existing.isEmpty();
        return new GuideCheckInStatus(category, checkedToday, computeStreak(userId, category));
    }

    @Transactional(readOnly = true)
    public @NonNull List<GuideCheckInStatus> getStatus(@NonNull Long userId) {
        LocalDate today = LocalDate.now();
        return CATEGORIES.stream()
                .map(category -> {
                    Set<LocalDate> dates = new HashSet<>(checkInRepository.findCheckedDates(
                            userId, category, today.minusDays(STREAK_LOOKBACK_DAYS), today));
                    boolean checkedToday = dates.contains(today);
                    return new GuideCheckInStatus(category, checkedToday, computeStreak(dates, today));
                })
                .toList();
    }

    private int computeStreak(Long userId, String category) {
        LocalDate today = LocalDate.now();
        Set<LocalDate> dates = new HashSet<>(checkInRepository.findCheckedDates(
                userId, category, today.minusDays(STREAK_LOOKBACK_DAYS), today));
        return computeStreak(dates, today);
    }

    // 오늘 아직 체크 전이어도 어제까지 이어져 있으면 진행 중인 연속 기록으로 인정한다
    private int computeStreak(Set<LocalDate> checkedDates, LocalDate today) {
        LocalDate cursor = checkedDates.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (checkedDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
