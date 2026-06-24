package com.checkupai.dto.payment;

import com.checkupai.domain.payment.PaymentStatus;
import com.checkupai.domain.payment.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class PaymentHistoryResponse {

    private Long paymentId;
    private String orderId;
    private Integer amount;
    private PaymentStatus status;
    private PaymentType paymentType;
    private Long checkupId;
    private LocalDateTime paidAt;
}
