package com.checkupai.domain.payment;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.ai.AiReportService;
import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.checkup.HealthCheckupRepository;
import com.checkupai.domain.notification.NotificationService;
import com.checkupai.domain.report.AiReport;
import com.checkupai.domain.report.AiReportRepository;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.payment.AnnualPaymentRequest;
import com.checkupai.dto.payment.PaymentConfirmRequest;
import com.checkupai.dto.payment.PaymentHistoryResponse;
import com.checkupai.dto.payment.PaymentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private static final int SINGLE_PRICE = 1900;
    private static final int MONTHLY_PRICE = 9900;

    private final TossPaymentClient tossPaymentClient;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final HealthCheckupRepository checkupRepository;
    private final AiReportRepository aiReportRepository;
    private final AiReportService aiReportService;
    private final NotificationService notificationService;

    public @NonNull PaymentResponse confirmSingle(@NonNull Long userId, @NonNull PaymentConfirmRequest req) {
        if (!req.getAmount().equals(SINGLE_PRICE)) {
            throw new CustomException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        // 결제 시점까지 AI 리포트가 아직 생성되지 않았다면(사용자가 미리보기만 보고 바로 구매한 경우)
        // 여기서 생성한다 — analyze()는 이미 존재하면 재사용하는 find-or-create 로직이라 안전하다.
        AiReport report = aiReportRepository.findByCheckupIdAndUserId(req.getCheckupId(), userId)
                .orElseGet(() -> {
                    aiReportService.analyze(userId, req.getCheckupId());
                    return aiReportRepository.findByCheckupIdAndUserId(req.getCheckupId(), userId)
                            .orElseThrow(() -> new CustomException(ErrorCode.AI_REPORT_NOT_FOUND));
                });

        if (Boolean.TRUE.equals(report.getIsPaid())) {
            throw new CustomException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        // Toss 결제 검증
        tossPaymentClient.confirm(req.getPaymentKey(), req.getOrderId(), req.getAmount());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        HealthCheckup checkup = checkupRepository.findByIdAndUserId(req.getCheckupId(), userId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHECKUP_NOT_FOUND));

        Payment payment = paymentRepository.save(Payment.builder()
                .user(user)
                .paymentKey(req.getPaymentKey())
                .orderId(req.getOrderId())
                .paymentType(PaymentType.SINGLE)
                .amount(req.getAmount())
                .status(PaymentStatus.COMPLETED)
                .checkup(checkup)
                .paidAt(LocalDateTime.now())
                .build());

        report.unlock();

        notificationService.create(userId, "결제가 완료됐어요",
                "AI 리포트 전체 분석 결과를 확인할 수 있어요.");

        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .checkupId(req.getCheckupId())
                .reportUnlocked(true)
                .build();
    }

    public @NonNull PaymentResponse confirmMonthly(@NonNull Long userId, @NonNull AnnualPaymentRequest req) {
        if (!req.getAmount().equals(MONTHLY_PRICE)) {
            throw new CustomException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        tossPaymentClient.confirm(req.getPaymentKey(), req.getOrderId(), req.getAmount());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Payment payment = paymentRepository.save(Payment.builder()
                .user(user)
                .paymentKey(req.getPaymentKey())
                .orderId(req.getOrderId())
                .paymentType(PaymentType.MONTHLY)
                .amount(req.getAmount())
                .status(PaymentStatus.COMPLETED)
                .checkup(null)
                .paidAt(LocalDateTime.now())
                .build());

        LocalDateTime expiry = LocalDateTime.now().plusMonths(1);
        user.grantAnnualPass(expiry);

        notificationService.create(userId, "프리미엄 결제가 완료됐어요",
                "이제 모든 AI 분석과 맞춤 가이드를 이용할 수 있어요.");

        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .annualPassGranted(true)
                .annualPassExpiry(expiry)
                .build();
    }

    @Transactional(readOnly = true)
    public @NonNull List<PaymentHistoryResponse> getHistory(@NonNull Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(p -> PaymentHistoryResponse.builder()
                        .paymentId(p.getId())
                        .orderId(p.getOrderId())
                        .amount(p.getAmount())
                        .status(p.getStatus())
                        .paymentType(p.getPaymentType())
                        .checkupId(p.getCheckup() != null ? p.getCheckup().getId() : null)
                        .paidAt(p.getPaidAt())
                        .build())
                .toList();
    }

    public @NonNull PaymentResponse refund(@NonNull Long userId, @NonNull Long paymentId) {
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new CustomException(ErrorCode.PAYMENT_ALREADY_REFUNDED);
        }

        if (payment.getPaidAt() == null || payment.getPaidAt().isBefore(LocalDateTime.now().minusDays(7))) {
            throw new CustomException(ErrorCode.PAYMENT_REFUND_EXPIRED);
        }

        tossPaymentClient.cancel(payment.getPaymentKey(), "고객 환불 요청");
        payment.refund();

        if (payment.getPaymentType() == PaymentType.SINGLE && payment.getCheckup() != null) {
            aiReportRepository.findByCheckupIdAndUserId(payment.getCheckup().getId(), userId)
                    .ifPresent(AiReport::lock);
        }

        if (payment.getPaymentType() == PaymentType.MONTHLY) {
            userRepository.findById(userId).ifPresent(User::revokeAnnualPass);
        }

        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .build();
    }
}
