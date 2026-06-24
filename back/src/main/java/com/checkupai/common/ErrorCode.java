package com.checkupai.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Auth
    EMAIL_DUPLICATE("이미 사용 중인 이메일입니다.", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS("이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED("인증이 필요합니다.", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("접근 권한이 없습니다.", HttpStatus.FORBIDDEN),

    // User
    USER_NOT_FOUND("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Checkup
    CHECKUP_NOT_FOUND("검진 기록을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Goals
    GOAL_NOT_FOUND("건강 목표를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Daily
    DAILY_NOT_FOUND("해당 날짜의 일상 기록을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Notification
    NOTIFICATION_NOT_FOUND("알림을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // PDF
    PDF_EMPTY("파일이 비어있습니다.", HttpStatus.BAD_REQUEST),
    PDF_INVALID_TYPE("PDF 파일만 업로드 가능합니다.", HttpStatus.BAD_REQUEST),
    PDF_TOO_LARGE("파일 크기가 10MB를 초과합니다.", HttpStatus.BAD_REQUEST),
    PDF_PARSE_INCOMPLETE("PDF에서 필수 항목(키, 체중)을 추출하지 못했습니다.", HttpStatus.UNPROCESSABLE_ENTITY),

    // AI
    AI_REPORT_NOT_FOUND("AI 리포트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    AI_API_ERROR("AI 분석 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),

    // Payment
    PAYMENT_AMOUNT_MISMATCH("결제 금액이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_FOUND("결제 내역을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    PAYMENT_TOSS_ERROR("토스 결제 처리 중 오류가 발생했습니다.", HttpStatus.BAD_GATEWAY),
    PAYMENT_REFUND_EXPIRED("환불 가능 기간(7일)이 지났습니다.", HttpStatus.BAD_REQUEST),
    PAYMENT_ALREADY_REFUNDED("이미 환불된 결제입니다.", HttpStatus.BAD_REQUEST),
    PAYMENT_ALREADY_COMPLETED("이미 결제된 리포트입니다.", HttpStatus.BAD_REQUEST),

    // Server
    INTERNAL_SERVER_ERROR("서버 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String message;
    private final HttpStatus status;

    ErrorCode(String message, HttpStatus status) {
        this.message = message;
        this.status = status;
    }
}
