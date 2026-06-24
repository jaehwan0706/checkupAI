package com.checkupai.domain.vitals;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface VitalsRepository extends JpaRepository<Vitals, Long> {

    @Query("SELECT v FROM Vitals v WHERE v.user.id = :userId AND v.recordedDate >= :from ORDER BY v.recordedDate DESC, v.createdAt DESC")
    List<Vitals> findRecentByUserId(@Param("userId") Long userId, @Param("from") LocalDate from);

    @Query("SELECT v FROM Vitals v WHERE v.user.id = :userId ORDER BY v.recordedDate DESC, v.createdAt DESC")
    List<Vitals> findAllByUserId(@Param("userId") Long userId);
}
