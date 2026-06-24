package com.checkupai.domain.payment;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.config.TossProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TossPaymentClient {

    private static final String CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
    private static final String CANCEL_URL_TEMPLATE = "https://api.tosspayments.com/v1/payments/%s/cancel";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final TossProperties tossProperties;
    private final ObjectMapper objectMapper;
    private final OkHttpClient httpClient = new OkHttpClient();

    public TossConfirmResponse confirm(String paymentKey, String orderId, int amount) {
        String credentials = encodeCredentials();
        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "paymentKey", paymentKey,
                    "orderId", orderId,
                    "amount", amount
            ));
            Request request = new Request.Builder()
                    .url(CONFIRM_URL)
                    .post(RequestBody.create(json, JSON))
                    .header("Authorization", "Basic " + credentials)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String body = response.body() != null ? response.body().string() : "{}";
                if (!response.isSuccessful()) {
                    log.error("Toss confirm failed code={} body={}", response.code(), body);
                    throw new CustomException(ErrorCode.PAYMENT_TOSS_ERROR);
                }
                return objectMapper.readValue(body, TossConfirmResponse.class);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Toss confirm error", e);
            throw new CustomException(ErrorCode.PAYMENT_TOSS_ERROR);
        }
    }

    public void cancel(String paymentKey, String cancelReason) {
        String credentials = encodeCredentials();
        try {
            String json = objectMapper.writeValueAsString(Map.of("cancelReason", cancelReason));
            String url = String.format(CANCEL_URL_TEMPLATE, paymentKey);
            Request request = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(json, JSON))
                    .header("Authorization", "Basic " + credentials)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String body = response.body() != null ? response.body().string() : "{}";
                    log.error("Toss cancel failed code={} body={}", response.code(), body);
                    throw new CustomException(ErrorCode.PAYMENT_TOSS_ERROR);
                }
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Toss cancel error", e);
            throw new CustomException(ErrorCode.PAYMENT_TOSS_ERROR);
        }
    }

    private String encodeCredentials() {
        return Base64.getEncoder().encodeToString(
                (tossProperties.getSecretKey() + ":").getBytes(StandardCharsets.UTF_8));
    }

    @Getter
    @Setter
    public static class TossConfirmResponse {
        private String paymentKey;
        private String orderId;
        private String status;
        private int totalAmount;
    }
}
