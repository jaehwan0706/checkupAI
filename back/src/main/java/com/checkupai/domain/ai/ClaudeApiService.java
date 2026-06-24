package com.checkupai.domain.ai;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.checkup.HealthCheckup;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaudeApiService {

    @Value("${claude.api.key}")
    private String apiKey;

    @Value("${claude.api.url}")
    private String apiUrl;

    @Value("${claude.api.model}")
    private String model;

    private final ObjectMapper objectMapper;

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private static final String SYSTEM_PROMPT =
            "당신은 건강검진 결과를 쉽게 설명해주는 AI 건강 도우미입니다.\n" +
            "의료 진단이 아닌 정보 제공 목적으로만 사용됩니다.\n" +
            "모든 설명은 한국어로 작성하고, 전문 용어 대신 쉬운 말을 사용하세요.\n" +
            "각 수치에 대해 정상/주의/위험 상태를 판단하고 생활습관 개선 방법을 제안하세요.";

    public String analyze(HealthCheckup checkup) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY 미설정 — Mock 응답 반환");
            return mockResponse(checkup);
        }

        String userPrompt = buildPrompt(checkup);

        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .build();

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("max_tokens", 2048);
            body.put("system", SYSTEM_PROMPT);

            ArrayNode messages = objectMapper.createArrayNode();
            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);
            messages.add(userMessage);
            body.set("messages", messages);

            Request request = new Request.Builder()
                    .url(apiUrl)
                    .addHeader("x-api-key", apiKey)
                    .addHeader("anthropic-version", "2023-06-01")
                    .post(RequestBody.create(objectMapper.writeValueAsString(body), JSON))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "no body";
                    log.error("Claude API 오류 status={} body={}", response.code(), errorBody);
                    throw new CustomException(ErrorCode.AI_API_ERROR);
                }
                String responseBody = response.body().string();
                return extractContent(responseBody);
            }
        } catch (CustomException e) {
            throw e;
        } catch (IOException e) {
            log.error("Claude API 호출 실패", e);
            throw new CustomException(ErrorCode.AI_API_ERROR);
        }
    }

    private String buildPrompt(HealthCheckup c) {
        return String.format("""
                다음은 건강검진 결과입니다. 각 항목을 분석해주세요:
                - 검진일: %s
                - 키: %scm, 체중: %skg, BMI: %s
                - 혈압: %s/%s mmHg
                - 공복혈당: %s mg/dL
                - 총콜레스테롤: %s mg/dL
                - LDL: %s mg/dL
                - HDL: %s mg/dL
                - AST: %s U/L, ALT: %s U/L
                - 크레아티닌: %s mg/dL

                아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
                {
                  "summary": "전체 건강 상태 요약 (2-3문장)",
                  "details": [
                    {
                      "item": "항목명",
                      "value": "수치",
                      "status": "NORMAL 또는 WARNING 또는 DANGER",
                      "explanation": "이 수치가 무엇인지 쉬운 설명 (2-3문장)",
                      "advice": "개선 방법 또는 유지 방법 (1-2문장)"
                    }
                  ],
                  "lifestyle": {
                    "food": "식습관 개선 가이드 (3-4문장)",
                    "exercise": "운동 가이드 (2-3문장)",
                    "sleep": "수면 가이드 (1-2문장)"
                  }
                }
                """,
                fmt(c.getCheckupDate()),
                fmt(c.getHeight()), fmt(c.getWeight()), fmt(c.getBmi()),
                fmt(c.getSystolicBp()), fmt(c.getDiastolicBp()),
                fmt(c.getFastingBloodSugar()),
                fmt(c.getTotalCholesterol()),
                fmt(c.getLdlCholesterol()),
                fmt(c.getHdlCholesterol()),
                fmt(c.getAst()), fmt(c.getAlt()),
                fmt(c.getCreatinine())
        );
    }

    private String extractContent(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        String text = root.path("content").get(0).path("text").asText();
        return stripMarkdownCodeBlock(text);
    }

    private String stripMarkdownCodeBlock(String text) {
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        return text.trim();
    }

    private String fmt(Object value) {
        return value != null ? value.toString() : "미측정";
    }

    private String mockResponse(HealthCheckup c) {
        return """
                {
                  "summary": "[Mock] 전반적으로 양호한 건강 상태입니다. 혈압과 혈당이 정상 범위에 있으며, 콜레스테롤 수치는 약간 관리가 필요합니다. 규칙적인 생활습관을 유지하면 건강을 잘 지킬 수 있습니다.",
                  "details": [
                    {
                      "item": "혈압",
                      "value": "%s/%s mmHg",
                      "status": "NORMAL",
                      "explanation": "혈압은 심장이 혈액을 내보낼 때의 압력입니다. 수축기 120mmHg, 이완기 80mmHg는 이상적인 정상 수치입니다.",
                      "advice": "현재 혈압을 잘 유지하고 있습니다. 저염식 식단과 규칙적인 운동을 지속하세요."
                    },
                    {
                      "item": "공복혈당",
                      "value": "%s mg/dL",
                      "status": "WARNING",
                      "explanation": "공복혈당은 8시간 이상 금식 후 측정한 혈중 포도당 수치입니다. 100~125 mg/dL는 공복혈당 장애 범위로 당뇨 전단계입니다.",
                      "advice": "단순당(과자, 음료수) 섭취를 줄이고 식후 30분 가벼운 산책을 추천합니다."
                    },
                    {
                      "item": "총콜레스테롤",
                      "value": "%s mg/dL",
                      "status": "WARNING",
                      "explanation": "콜레스테롤은 세포막을 구성하는 지방 성분입니다. 200 mg/dL 이상은 경계성 높음으로 관리가 필요합니다.",
                      "advice": "포화지방이 많은 육류·튀김 섭취를 줄이고 등 푸른 생선과 채소를 늘리세요."
                    },
                    {
                      "item": "BMI",
                      "value": "%s",
                      "status": "NORMAL",
                      "explanation": "BMI는 체중(kg)을 키(m)의 제곱으로 나눈 값으로 비만도를 측정합니다. 18.5~24.9는 정상 범위입니다.",
                      "advice": "현재 정상 체중을 잘 유지하고 있습니다. 꾸준한 운동으로 유지하세요."
                    }
                  ],
                  "lifestyle": {
                    "food": "혈당과 콜레스테롤 관리를 위해 정제된 탄수화물(흰쌀, 빵)보다는 잡곡밥을 선택하세요. 채소와 단백질 위주의 균형 잡힌 식단을 유지하고, 가공식품과 음료수의 당분 섭취를 줄이는 것이 중요합니다. 하루 세 끼를 규칙적으로 먹고 과식을 피하세요.",
                    "exercise": "주 3~4회 30분 이상의 유산소 운동(빠르게 걷기, 자전거, 수영)을 권장합니다. 근력 운동을 병행하면 기초대사량을 높여 혈당과 콜레스테롤 관리에 도움이 됩니다.",
                    "sleep": "규칙적인 수면 시간을 지키고 하루 7~8시간 수면을 취하세요. 수면 부족은 혈당 조절 능력을 저하시킵니다."
                  }
                }
                """.formatted(
                fmt(c.getSystolicBp()), fmt(c.getDiastolicBp()),
                fmt(c.getFastingBloodSugar()),
                fmt(c.getTotalCholesterol()),
                fmt(c.getBmi())
        );
    }
}
