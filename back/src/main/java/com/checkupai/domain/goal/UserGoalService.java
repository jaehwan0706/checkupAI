package com.checkupai.domain.goal;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.goal.GoalItemDto;
import com.checkupai.dto.goal.GoalSaveRequest;
import com.checkupai.dto.goal.GoalUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserGoalService {

    private final UserGoalRepository goalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public @NonNull List<GoalItemDto> findAll(@NonNull Long userId) {
        return goalRepository.findByUserIdOrderByIdAsc(userId).stream()
                .map(GoalItemDto::from)
                .toList();
    }

    @Transactional
    public @NonNull List<GoalItemDto> saveAll(@NonNull Long userId, @NonNull GoalSaveRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        goalRepository.deleteAllByUserId(userId);

        List<UserGoal> goals = request.getGoals().stream()
                .map(dto -> UserGoal.builder()
                        .user(user)
                        .goalKey(dto.getId())
                        .icon(dto.getIcon())
                        .title(dto.getTitle())
                        .detail(dto.getDetail())
                        .pct(dto.getPct())
                        .aiRecommended(dto.isAi())
                        .build())
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
}
