package com.checkupai.domain.medical;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("SELECT m FROM MedicalRecord m WHERE m.user.id = :userId ORDER BY m.recordedDate DESC, m.createdAt DESC")
    List<MedicalRecord> findAllByUserId(@Param("userId") Long userId);
}
