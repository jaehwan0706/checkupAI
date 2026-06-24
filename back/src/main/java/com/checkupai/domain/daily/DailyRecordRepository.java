package com.checkupai.domain.daily;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyRecordRepository extends JpaRepository<DailyRecord, Long> {
    List<DailyRecord> findByUserIdOrderByRecordDateDesc(Long userId);
    Optional<DailyRecord> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);
    List<DailyRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(Long userId, LocalDate start, LocalDate end);
}
