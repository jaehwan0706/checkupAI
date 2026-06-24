package com.checkupai.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AnnualPaymentRequest {

    @NotBlank(message = "paymentKey를 입력해주세요.")
    private String paymentKey;

    @NotBlank(message = "orderId를 입력해주세요.")
    private String orderId;

    @NotNull(message = "amount를 입력해주세요.")
    @Positive(message = "amount는 양수여야 합니다.")
    private Integer amount;
}
