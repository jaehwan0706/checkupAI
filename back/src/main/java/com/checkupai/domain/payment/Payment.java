package com.checkupai.domain.payment;

import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(unique = true)
    private String paymentKey;

    @Column(unique = true)
    private String orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkup_id")
    private HealthCheckup checkup;

    private LocalDateTime paidAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Payment(User user, String paymentKey, String orderId, PaymentType paymentType,
                   Integer amount, PaymentStatus status, HealthCheckup checkup, LocalDateTime paidAt) {
        this.user = user;
        this.paymentKey = paymentKey;
        this.orderId = orderId;
        this.paymentType = paymentType;
        this.amount = amount;
        this.status = status;
        this.checkup = checkup;
        this.paidAt = paidAt;
    }

    public void refund() {
        this.status = PaymentStatus.REFUNDED;
    }
}
