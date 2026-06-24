package com.checkupai.domain.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {
    List<UserGoal> findByUserIdOrderByIdAsc(Long userId);
    Optional<UserGoal> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("DELETE FROM UserGoal g WHERE g.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
