package com.checkupai.domain.meal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MealLogRepository extends JpaRepository<MealLog, Long> {

    Optional<MealLog> findByUserIdAndLogDateAndMealType(Long userId, LocalDate logDate, MealType mealType);

    List<MealLog> findByUserIdAndLogDateOrderByMealType(Long userId, LocalDate logDate);

    @Query("SELECT m FROM MealLog m WHERE m.user.id = :userId AND m.logDate BETWEEN :from AND :to ORDER BY m.logDate, m.mealType")
    List<MealLog> findByUserIdAndDateRange(Long userId, LocalDate from, LocalDate to);

    @Query("SELECT COUNT(m) FROM MealLog m WHERE m.user.id = :userId AND m.logDate BETWEEN :from AND :to")
    long countByUserIdAndDateRange(Long userId, LocalDate from, LocalDate to);
}
