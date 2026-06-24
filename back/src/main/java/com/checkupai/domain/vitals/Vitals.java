package com.checkupai.domain.vitals;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vitals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Vitals {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer systolic;
    private Integer diastolic;
    private Integer bloodSugar;

    @Column(length = 20)
    private String measuredAt;

    @Column(length = 200)
    private String memo;

    @Column(nullable = false)
    private LocalDate recordedDate;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Vitals(User user, Integer systolic, Integer diastolic, Integer bloodSugar,
                  String measuredAt, String memo, LocalDate recordedDate) {
        this.user = user;
        this.systolic = systolic;
        this.diastolic = diastolic;
        this.bloodSugar = bloodSugar;
        this.measuredAt = measuredAt;
        this.memo = memo;
        this.recordedDate = recordedDate;
    }
}
