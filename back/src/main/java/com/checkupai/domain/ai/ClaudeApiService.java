package com.checkupai.domain.ai;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.daily.DailyRecord;
import com.checkupai.domain.daily.SleepQuality;
import com.checkupai.domain.medical.MedicalRecord;
import com.checkupai.domain.medical.MedicalRecordType;
import com.checkupai.domain.user.Gender;
import com.checkupai.domain.user.User;
import com.checkupai.domain.vitals.Vitals;
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
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
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

    public String analyze(HealthCheckup checkup, User user, List<DailyRecord> dailyRecords, List<MedicalRecord> medicalRecords) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("CLAUDE_API_KEY 미설정 — Mock 응답 반환");
            return mockResponse(checkup);
        }

        String userPrompt = buildPrompt(checkup, user, dailyRecords, medicalRecords);

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

    private String buildPrompt(HealthCheckup c, User user, List<DailyRecord> dailyRecords, List<MedicalRecord> medicalRecords) {
        String genderStr = user.getGender() != null ?
                (user.getGender() == Gender.MALE ? "남성" : "여성") : "정보 없음";
        String ageStr = user.getBirthDate() != null ?
                Period.between(user.getBirthDate(), LocalDate.now()).getYears() + "세" : "정보 없음";

        StringBuilder dailySb = new StringBuilder();
        if (dailyRecords.isEmpty()) {
            dailySb.append("  (기록 없음)");
        } else {
            for (DailyRecord d : dailyRecords) {
                String exercise = (d.getExerciseType() != null && d.getExerciseMinutes() != null)
                        ? d.getExerciseType() + " " + d.getExerciseMinutes() + "분" : "없음";
                String sleep = d.getSleepHours() != null
                        ? d.getSleepHours() + "시간(" + sleepQualityKr(d.getSleepQuality()) + ")" : "미기록";
                dailySb.append(String.format("  - %s: 운동=%s, 수면=%s%n", d.getRecordDate(), exercise, sleep));
            }
        }

        StringBuilder medicalSb = new StringBuilder();
        if (medicalRecords.isEmpty()) {
            medicalSb.append("  (기록 없음)");
        } else {
            for (MedicalRecord m : medicalRecords) {
                String typeKr = m.getType() == MedicalRecordType.PHARMACY ? "약국" : "병원";
                String desc = m.getDescription() != null ? " - " + m.getDescription() : "";
                medicalSb.append(String.format("  - [%s] %s: %s%s%n", typeKr, m.getRecordedDate(), m.getTitle(), desc));
            }
        }

        return String.format("""
                [사용자 기본 정보]
                - 성별: %s
                - 나이: %s

                [건강검진 결과 - %s]
                - 키: %scm, 체중: %skg, BMI: %s
                - 혈압: %s/%s mmHg
                - 공복혈당: %s mg/dL
                - 총콜레스테롤: %s mg/dL
                - LDL: %s mg/dL, HDL: %s mg/dL
                - AST: %s U/L, ALT: %s U/L
                - 크레아티닌: %s mg/dL

                [최근 7일 생활 기록]
                %s
                [최근 진료/처방 기록]
                %s
                위 데이터를 종합 분석하여 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
                {
                  "summary": "전체 건강 상태 요약 (성별·나이·생활패턴 반영, 2-3문장)",
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
                    "exercise": "운동 가이드 (생활 기록 반영, 2-3문장)",
                    "sleep": "수면 가이드 (생활 기록 반영, 1-2문장)"
                  }
                }
                """,
                genderStr, ageStr,
                fmt(c.getCheckupDate()),
                fmt(c.getHeight()), fmt(c.getWeight()), fmt(c.getBmi()),
                fmt(c.getSystolicBp()), fmt(c.getDiastolicBp()),
                fmt(c.getFastingBloodSugar()),
                fmt(c.getTotalCholesterol()),
                fmt(c.getLdlCholesterol()), fmt(c.getHdlCholesterol()),
                fmt(c.getAst()), fmt(c.getAlt()),
                fmt(c.getCreatinine()),
                dailySb.toString(),
                medicalSb.toString()
        );
    }

    private String sleepQualityKr(SleepQuality q) {
        if (q == null) return "미기록";
        return switch (q) {
            case GOOD -> "양호";
            case NORMAL -> "보통";
            case BAD -> "나쁨";
        };
    }

    /* ── 카테고리 분석: 혈압·혈당 ── */
    public CategoryAiResponse analyzeVitals(User user, List<Vitals> vitals) {
        if (apiKey == null || apiKey.isBlank()) {
            return mockVitalsResponse();
        }
        try {
            return parseCategoryResponse(callClaude(buildVitalsPrompt(user, vitals)));
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Claude API 호출 실패 (vitals)", e);
            throw new CustomException(ErrorCode.AI_API_ERROR);
        }
    }

    /* ── 카테고리 분석: 약국/병원 ── */
    public CategoryAiResponse analyzeMedical(User user, List<MedicalRecord> medicals) {
        if (apiKey == null || apiKey.isBlank()) {
            return mockMedicalResponse();
        }
        try {
            return parseCategoryResponse(callClaude(buildMedicalPrompt(user, medicals)));
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Claude API 호출 실패 (medical)", e);
            throw new CustomException(ErrorCode.AI_API_ERROR);
        }
    }

    private String callClaude(String userPrompt) throws IOException {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .build();

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
            return extractContent(response.body().string());
        }
    }

    private CategoryAiResponse parseCategoryResponse(String raw) {
        try {
            return objectMapper.readValue(raw, CategoryAiResponse.class);
        } catch (Exception e) {
            log.error("카테고리 AI 응답 파싱 실패: {}", raw, e);
            throw new CustomException(ErrorCode.AI_API_ERROR);
        }
    }

    private String buildVitalsPrompt(User user, List<Vitals> vitals) {
        String genderStr = user.getGender() != null ?
                (user.getGender() == Gender.MALE ? "남성" : "여성") : "정보 없음";
        String ageStr = user.getBirthDate() != null ?
                Period.between(user.getBirthDate(), LocalDate.now()).getYears() + "세" : "정보 없음";

        StringBuilder sb = new StringBuilder();
        for (Vitals v : vitals) {
            sb.append(String.format("  - %s:", v.getRecordedDate()));
            if (v.getSystolic() != null)
                sb.append(String.format(" 혈압=%d/%s mmHg", v.getSystolic(),
                        v.getDiastolic() != null ? v.getDiastolic() : "?"));
            if (v.getBloodSugar() != null)
                sb.append(String.format(" 혈당=%d mg/dL", v.getBloodSugar()));
            if (v.getMeasuredAt() != null)
                sb.append(String.format(" 측정시간=%s", v.getMeasuredAt()));
            if (v.getMemo() != null)
                sb.append(String.format(" 메모=%s", v.getMemo()));
            sb.append("\n");
        }

        return String.format("""
                [사용자 기본 정보]
                - 성별: %s
                - 나이: %s

                [혈압·혈당 측정 기록 - 총 %d건]
                %s
                위 데이터를 분석하여 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
                {
                  "summary": "전반적 트렌드 요약 및 위험도 평가 (2-3문장)",
                  "details": [
                    {
                      "title": "혈압 분석",
                      "content": "혈압 변화 추세, 위험도 평가, 주의사항 (3-4문장)"
                    },
                    {
                      "title": "혈당 분석",
                      "content": "혈당 변화 추세, 위험도 평가, 주의사항 (3-4문장)"
                    }
                  ],
                  "advice": "종합적인 혈압·혈당 관리 생활습관 가이드 (3-4문장)"
                }
                """,
                genderStr, ageStr,
                vitals.size(),
                sb.toString()
        );
    }

    private String buildMedicalPrompt(User user, List<MedicalRecord> medicals) {
        String genderStr = user.getGender() != null ?
                (user.getGender() == Gender.MALE ? "남성" : "여성") : "정보 없음";
        String ageStr = user.getBirthDate() != null ?
                Period.between(user.getBirthDate(), LocalDate.now()).getYears() + "세" : "정보 없음";

        StringBuilder sb = new StringBuilder();
        for (MedicalRecord m : medicals) {
            String typeKr = m.getType() == MedicalRecordType.PHARMACY ? "약국" : "병원";
            String desc = m.getDescription() != null ? " - " + m.getDescription() : "";
            sb.append(String.format("  - [%s] %s: %s%s%n", typeKr, m.getRecordedDate(), m.getTitle(), desc));
        }

        return String.format("""
                [사용자 기본 정보]
                - 성별: %s
                - 나이: %s

                [약국/병원 기록 - 총 %d건]
                %s
                위 데이터를 분석하여 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
                {
                  "summary": "전체 진료·처방 현황 요약 (2-3문장)",
                  "details": [
                    {
                      "title": "기록 제목을 그대로 사용",
                      "content": "약국이면 약 성분·주의사항·복용 관리법, 병원이면 진단 분석·관리 방법 (3-4문장)"
                    }
                  ],
                  "advice": "전체 기록 기반 종합 건강 관리 가이드 (2-3문장)"
                }
                """,
                genderStr, ageStr,
                medicals.size(),
                sb.toString()
        );
    }

    private CategoryAiResponse mockVitalsResponse() {
        return CategoryAiResponse.builder()
                .summary("[Mock] 측정 기록을 분석한 결과, 혈압이 주의 범위에 있으며 혈당은 정상 범위를 유지하고 있습니다. 지속적인 모니터링과 생활습관 개선이 필요합니다.")
                .details(List.of(
                        new CategoryAiResponse.DetailItem("혈압 분석",
                                "수축기 혈압이 120-140mmHg 범위에서 변동하고 있어 주의 단계에 해당합니다. 저염식 식단(하루 나트륨 2g 이하)과 규칙적인 유산소 운동이 도움이 됩니다. 스트레스와 수면 부족이 혈압을 높일 수 있으므로 관리가 필요합니다."),
                        new CategoryAiResponse.DetailItem("혈당 분석",
                                "혈당 수치가 대체로 정상 범위(70-99 mg/dL)를 유지하고 있습니다. 현재 상태를 유지하기 위해 식후 가벼운 산책(10-15분)을 권장합니다. 정제된 탄수화물과 당류 섭취를 줄이는 것이 중요합니다.")
                ))
                .advice("매일 같은 시간에 혈압과 혈당을 측정하는 습관을 들이세요. 충분한 수면(7-8시간), 스트레스 관리, 금연이 두 수치 모두 개선에 효과적입니다. 이상 수치가 지속되면 전문의 상담을 권장합니다.")
                .build();
    }

    private CategoryAiResponse mockMedicalResponse() {
        return CategoryAiResponse.builder()
                .summary("[Mock] 약국 처방 및 병원 진료 기록이 확인되었습니다. 처방약의 꾸준한 복용과 정기적인 추적 관찰이 중요합니다.")
                .details(List.of(
                        new CategoryAiResponse.DetailItem("처방 기록 분석",
                                "처방된 약물은 정해진 시간에 꾸준히 복용하는 것이 중요합니다. 임의로 복용을 중단하면 증상이 악화될 수 있습니다. 부작용(두통, 어지럼증 등)이 나타나면 즉시 처방 의사와 상담하세요. 다른 약물과의 상호작용에도 주의가 필요합니다.")
                ))
                .advice("정기적인 병원 방문과 처방약 복용을 지속하세요. 생활습관 개선(저염식, 규칙적 운동, 금연)과 병행하면 치료 효과가 높아집니다.")
                .build();
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
