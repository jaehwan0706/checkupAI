package com.checkupai.domain.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GoalCheckInRepository extends JpaRepository<GoalCheckIn, Long> {

    Optional<GoalCheckIn> findByGoalIdAndCheckedDate(Long goalId, LocalDate date);

    @Query("SELECT c FROM GoalCheckIn c WHERE c.goal.id = :goalId AND c.checkedDate BETWEEN :from AND :to ORDER BY c.checkedDate")
    List<GoalCheckIn> findByGoalAndDateRange(@Param("goalId") Long goalId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    // 한 유저의 여러 목표 체크인 횟수를 goalId별로 집계 — N+1 방지
    @Query("SELECT c.goal.id, COUNT(c) FROM GoalCheckIn c WHERE c.user.id = :userId AND c.checkedDate BETWEEN :from AND :to GROUP BY c.goal.id")
    List<Object[]> countByUserAndDateRange(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Modifying
    @Query("DELETE FROM GoalCheckIn c WHERE c.goal.user.id = :userId")
    void deleteAllByGoalUserId(@Param("userId") Long userId);
}
