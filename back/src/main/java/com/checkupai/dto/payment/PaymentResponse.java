package com.checkupai.dto.payment;

import com.checkupai.domain.payment.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class PaymentResponse {

    private Long paymentId;
    private String orderId;
    private Integer amount;
    private PaymentStatus status;

    // 단건 결제 시
    private Long checkupId;
    private Boolean reportUnlocked;

    // 연간 패스 결제 시
    private Boolean annualPassGranted;
    private LocalDateTime annualPassExpiry;
}
