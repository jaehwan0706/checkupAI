package com.checkupai.domain.goal;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoalCheckInService {

    private final GoalCheckInRepository checkInRepository;
    private final UserGoalRepository goalRepository;
    private final UserRepository userRepository;

    @Transactional
    public boolean toggle(Long userId, Long goalId) {
        UserGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.GOAL_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        LocalDate today = LocalDate.now();
        Optional<GoalCheckIn> existing = checkInRepository.findByGoalIdAndCheckedDate(goalId, today);
        if (existing.isPresent()) {
            checkInRepository.delete(existing.get());
            return false;
        } else {
            checkInRepository.save(GoalCheckIn.builder().user(user).goal(goal).checkedDate(today).build());
            return true;
        }
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getMonthlyCheckIns(Long userId, Long goalId, YearMonth month) {
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.GOAL_NOT_FOUND));
        return checkInRepository.findByGoalAndDateRange(goalId, month.atDay(1), month.atEndOfMonth())
                .stream()
                .map(GoalCheckIn::getCheckedDate)
                .toList();
    }
}
