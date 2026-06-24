package com.checkupai.domain.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByIsReadAscCreatedAtDesc(Long userId);
    boolean existsByUserIdAndIsReadFalse(Long userId);
}
