package com.checkupai.domain.report;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiReportRepository extends JpaRepository<AiReport, Long> {
    List<AiReport> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<AiReport> findByCheckupIdAndUserId(Long checkupId, Long userId);
}
