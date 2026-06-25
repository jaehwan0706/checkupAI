package com.checkupai.domain.payment;

import com.checkupai.common.ApiResponse;
import com.checkupai.dto.payment.AnnualPaymentRequest;
import com.checkupai.dto.payment.PaymentConfirmRequest;
import com.checkupai.dto.payment.PaymentHistoryResponse;
import com.checkupai.dto.payment.PaymentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<PaymentResponse> confirmSingle(
            @AuthenticationPrincipal @NonNull Long userId,
            @Valid @RequestBody @NonNull PaymentConfirmRequest request) {
        return ApiResponse.success(paymentService.confirmSingle(userId, request), "결제가 완료되었습니다.");
    }

    @PostMapping("/monthly")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<PaymentResponse> confirmMonthly(
            @AuthenticationPrincipal @NonNull Long userId,
            @Valid @RequestBody @NonNull AnnualPaymentRequest request) {
        return ApiResponse.success(paymentService.confirmMonthly(userId, request), "월간 패스가 활성화되었습니다.");
    }

    @GetMapping("/history")
    public @NonNull ApiResponse<List<PaymentHistoryResponse>> getHistory(
            @AuthenticationPrincipal @NonNull Long userId) {
        return ApiResponse.success(paymentService.getHistory(userId));
    }

    @PostMapping("/refund/{paymentId}")
    public @NonNull ApiResponse<PaymentResponse> refund(
            @AuthenticationPrincipal @NonNull Long userId,
            @PathVariable @NonNull Long paymentId) {
        return ApiResponse.success(paymentService.refund(userId, paymentId), "환불이 완료되었습니다.");
    }
}
