package com.checkupai.domain.report;

import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class AiReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkup_id", nullable = false)
    private HealthCheckup checkup;

    @Column(columnDefinition = "TEXT")
    private String reportContent;

    @Column(nullable = false)
    private Boolean isPaid;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public AiReport(User user, HealthCheckup checkup, String reportContent, Boolean isPaid) {
        this.user = user;
        this.checkup = checkup;
        this.reportContent = reportContent;
        this.isPaid = isPaid;
    }

    public void unlock() {
        this.isPaid = true;
    }

    public void lock() {
        this.isPaid = false;
    }
}
