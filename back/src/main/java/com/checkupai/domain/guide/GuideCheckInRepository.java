package com.checkupai.domain.guide;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GuideCheckInRepository extends JpaRepository<GuideCheckIn, Long> {

    Optional<GuideCheckIn> findByUserIdAndCategoryAndCheckedDate(Long userId, String category, LocalDate date);

    @Query("SELECT c.checkedDate FROM GuideCheckIn c WHERE c.user.id = :userId AND c.category = :category " +
            "AND c.checkedDate BETWEEN :from AND :to ORDER BY c.checkedDate DESC")
    List<LocalDate> findCheckedDates(@Param("userId") Long userId, @Param("category") String category,
                                      @Param("from") LocalDate from, @Param("to") LocalDate to);
}
