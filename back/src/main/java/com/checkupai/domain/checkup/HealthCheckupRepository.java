package com.checkupai.domain.checkup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthCheckupRepository extends JpaRepository<HealthCheckup, Long> {
    List<HealthCheckup> findByUserIdOrderByCheckupDateDesc(Long userId);
    Optional<HealthCheckup> findByIdAndUserId(Long checkupId, Long userId);
    Optional<HealthCheckup> findFirstByUserIdOrderByCheckupDateDesc(Long userId);

}
