package com.checkupai.domain.checkup;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_checkups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class HealthCheckup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate checkupDate;
    private Double height;
    private Double weight;
    private Double bmi;
    private Integer healthScore;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Integer fastingBloodSugar;
    private Integer totalCholesterol;
    private Integer ldlCholesterol;
    private Integer hdlCholesterol;
    private Integer ast;
    private Integer alt;
    private Double creatinine;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public HealthCheckup(User user, LocalDate checkupDate, Double height, Double weight, Double bmi,
                         Integer healthScore, Integer systolicBp, Integer diastolicBp,
                         Integer fastingBloodSugar, Integer totalCholesterol, Integer ldlCholesterol,
                         Integer hdlCholesterol, Integer ast, Integer alt, Double creatinine) {
        this.user = user;
        this.checkupDate = checkupDate;
        this.height = height;
        this.weight = weight;
        this.bmi = bmi;
        this.healthScore = healthScore;
        this.systolicBp = systolicBp;
        this.diastolicBp = diastolicBp;
        this.fastingBloodSugar = fastingBloodSugar;
        this.totalCholesterol = totalCholesterol;
        this.ldlCholesterol = ldlCholesterol;
        this.hdlCholesterol = hdlCholesterol;
        this.ast = ast;
        this.alt = alt;
        this.creatinine = creatinine;
    }
}
