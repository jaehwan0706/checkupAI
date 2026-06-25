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
                  "healthScore": 75,
                  "summary": "전체 건강 상태 총평 (성별·나이·생활패턴 반영, 2-3문장)",
                  "riskItems": [
                    {
                      "name": "항목명",
                      "value": "수치",
                      "status": "위험 또는 주의 또는 정상",
                      "reason": "왜 이 수치가 위험/주의/정상인지 (1-2문장)",
                      "action": "지금 당장 해야 할 행동 (1문장)"
                    }
                  ],
                  "immediateActions": ["지금 실천할 것 1", "지금 실천할 것 2", "지금 실천할 것 3"],
                  "monthlyGoals": ["이번 달 목표 1", "이번 달 목표 2", "이번 달 목표 3"],
                  "nextCheckupRecommendation": "다음 검진 권고사항 (언제, 어떤 검사를 받아야 하는지)"
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
    public CategoryAiResponse analyzeMedical(User user, List<MedicalRecord> medicals, String type) {
        if (apiKey == null || apiKey.isBlank()) {
            return "PHARMACY".equals(type) ? mockPharmacyResponse() : mockHospitalResponse();
        }
        try {
            String prompt = "PHARMACY".equals(type)
                    ? buildPharmacyPrompt(user, medicals)
                    : buildHospitalPrompt(user, medicals);
            return parseCategoryResponse(callClaude(prompt));
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
                  "summary": "혈압·혈당 트렌드 종합 요약 (2-3문장)",
                  "trend": "상승 또는 하강 또는 안정",
                  "riskLevel": "위험 또는 주의 또는 정상",
                  "reason": "이 트렌드의 주요 원인 (1-2문장)",
                  "immediateActions": ["지금 실천할 것 1", "지금 실천할 것 2", "지금 실천할 것 3"],
                  "monthlyGoals": ["이번 달 목표 1", "이번 달 목표 2", "이번 달 목표 3"]
                }
                """,
                genderStr, ageStr,
                vitals.size(),
                sb.toString()
        );
    }

    private String buildPharmacyPrompt(User user, List<MedicalRecord> medicals) {
        String genderStr = user.getGender() != null ?
                (user.getGender() == Gender.MALE ? "남성" : "여성") : "정보 없음";
        String ageStr = user.getBirthDate() != null ?
                Period.between(user.getBirthDate(), LocalDate.now()).getYears() + "세" : "정보 없음";

        StringBuilder sb = new StringBuilder();
        for (MedicalRecord m : medicals) {
            String desc = m.getDescription() != null ? " - " + m.getDescription() : "";
            sb.append(String.format("  - %s: %s%s%n", m.getRecordedDate(), m.getTitle(), desc));
        }

        return String.format("""
                [사용자 기본 정보]
                - 성별: %s
                - 나이: %s

                [약국 처방 기록 - 총 %d건]
                %s
                위 데이터를 분석하여 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
                {
                  "summary": "처방약 전체 요약 (1-2문장)",
                  "medications": [
                    {
                      "name": "약 이름",
                      "purpose": "복용 목적 (1문장)",
                      "caution": "주의사항 (1문장)"
                    }
                  ],
                  "interactions": "약물 상호작용 또는 주의할 병용 금지사항 (1-2문장, 없으면 '특별한 상호작용 없음')",
                  "immediateActions": ["복용 지침 1", "복용 지침 2", "복용 지침 3"]
                }
                """,
                genderStr, ageStr,
                medicals.size(),
                sb.toString()
        );
    }

    private String buildHospitalPrompt(User user, List<MedicalRecord> medicals) {
        String genderStr = user.getGender() != null ?
                (user.getGender() == Gender.MALE ? "남성" : "여성") : "정보 없음";
        String ageStr = user.getBirthDate() != null ?
                Period.between(user.getBirthDate(), LocalDate.now()).getYears() + "세" : "정보 없음";

        StringBuilder sb = new StringBuilder();
        for (MedicalRecord m : medicals) {
            String desc = m.getDescription() != null ? " - " + m.getDescription() : "";
            sb.append(String.format("  - %s: %s%s%n", m.getRecordedDate(), m.getTitle(), desc));
        }

        return String.format("""
                [사용자 기본 정보]
                - 성별: %s
                - 나이: %s

                [병원 진료 기록 - 총 %d건]
                %s
                위 데이터를 분석하여 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
                {
                  "summary": "진료 전체 요약 (1-2문장)",
                  "diagnosis": "진단명 또는 주요 건강 이슈",
                  "reason": "원인 설명 (1-2문장)",
                  "immediateActions": ["관리 방법 1", "관리 방법 2", "관리 방법 3"],
                  "monthlyGoals": ["이번 달 건강 목표 1", "이번 달 건강 목표 2", "이번 달 건강 목표 3"]
                }
                """,
                genderStr, ageStr,
                medicals.size(),
                sb.toString()
        );
    }

    private CategoryAiResponse mockVitalsResponse() {
        return CategoryAiResponse.builder()
                .summary("[Mock] 혈압이 주의 범위에 있으며 혈당은 정상 범위를 유지하고 있습니다. 지속적인 모니터링과 생활습관 개선이 필요합니다.")
                .trend("상승")
                .riskLevel("주의")
                .reason("나트륨 섭취 증가 및 운동 부족으로 혈압이 서서히 상승하는 경향이 있습니다.")
                .immediateActions(List.of(
                        "나트륨 섭취를 하루 2g 이하로 줄이세요",
                        "식후 30분 가벼운 산책을 실천하세요",
                        "매일 같은 시간에 혈압을 측정하는 습관을 만드세요"
                ))
                .monthlyGoals(List.of(
                        "주 3회 이상 유산소 운동(30분) 실천",
                        "가공식품·라면 등 고염분 식품 섭취 주 2회 이하로 줄이기",
                        "수면 시간 7시간 이상 확보하기"
                ))
                .build();
    }

    private CategoryAiResponse mockPharmacyResponse() {
        return CategoryAiResponse.builder()
                .summary("[Mock] 처방약을 확인했습니다. 정해진 시간에 꾸준히 복용하고 주의사항을 지켜주세요.")
                .medications(List.of(
                        new CategoryAiResponse.MedicationItem("암로디핀 5mg", "고혈압 치료 — 칼슘 채널 차단제로 혈압을 낮춥니다.", "어지럼증이 나타날 수 있으니 기립 시 천천히 일어나세요."),
                        new CategoryAiResponse.MedicationItem("로수바스타틴 10mg", "고지혈증 치료 — LDL 콜레스테롤을 낮춥니다.", "근육통 발생 시 즉시 의사에게 알리세요.")
                ))
                .interactions("두 약물을 함께 복용해도 큰 상호작용은 없으나, 자몽 주스는 암로디핀 흡수를 높이므로 피하세요.")
                .immediateActions(List.of(
                        "매일 같은 시간(식후)에 복용하세요",
                        "임의로 중단하지 말고 처방 기간을 지켜주세요",
                        "부작용(어지럼증, 근육통)이 심하면 즉시 처방 의사와 상담하세요"
                ))
                .build();
    }

    private CategoryAiResponse mockHospitalResponse() {
        return CategoryAiResponse.builder()
                .summary("[Mock] 고혈압 전단계로 진단받았습니다. 약물 치료와 함께 생활습관 개선이 필요합니다.")
                .diagnosis("고혈압 전단계 (수축기 130-139 mmHg)")
                .reason("지속적인 염분 과다 섭취와 운동 부족, 스트레스로 인해 혈압이 서서히 상승했습니다.")
                .immediateActions(List.of(
                        "처방받은 혈압약을 매일 규칙적으로 복용하세요",
                        "저염식 식단(하루 나트륨 2g 이하)을 실천하세요",
                        "1주일에 한 번 혈압을 측정하고 기록하세요"
                ))
                .monthlyGoals(List.of(
                        "주 3회 이상 30분 유산소 운동 실천",
                        "체중 1kg 감량 목표 설정",
                        "다음 달 외래 진료 예약 확인"
                ))
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
                  "healthScore": 72,
                  "summary": "[Mock] 전반적으로 관리가 필요한 건강 상태입니다. 혈당과 콜레스테롤이 주의 범위에 있으며 지금부터 꾸준한 생활습관 개선이 중요합니다.",
                  "riskItems": [
                    {
                      "name": "혈압",
                      "value": "%s/%s mmHg",
                      "status": "정상",
                      "reason": "혈압이 정상 범위를 유지하고 있습니다.",
                      "action": "저염식 식단과 규칙적인 운동으로 현재 상태를 유지하세요."
                    },
                    {
                      "name": "공복혈당",
                      "value": "%s mg/dL",
                      "status": "주의",
                      "reason": "100~125 mg/dL는 당뇨 전단계 범위로 관리가 필요합니다.",
                      "action": "단순당 섭취를 줄이고 식후 30분 산책을 시작하세요."
                    },
                    {
                      "name": "총콜레스테롤",
                      "value": "%s mg/dL",
                      "status": "주의",
                      "reason": "200 mg/dL 이상은 경계성 높음으로 심혈관 위험이 서서히 높아집니다.",
                      "action": "포화지방(육류·튀김)을 줄이고 등 푸른 생선을 주 2회 이상 드세요."
                    },
                    {
                      "name": "BMI",
                      "value": "%s",
                      "status": "정상",
                      "reason": "BMI 18.5~24.9는 정상 범위입니다.",
                      "action": "꾸준한 운동으로 현재 체중을 유지하세요."
                    }
                  ],
                  "immediateActions": [
                    "매일 식후 30분 가벼운 산책을 시작하세요",
                    "음료수·과자·흰빵 등 단순당 섭취를 줄이세요",
                    "나트륨 섭취를 하루 2g 이하로 줄이세요"
                  ],
                  "monthlyGoals": [
                    "주 3회 이상 30분 유산소 운동 실천",
                    "잡곡밥으로 교체하고 채소 반찬 늘리기",
                    "콜레스테롤 재검사 예약하기"
                  ],
                  "nextCheckupRecommendation": "6개월 후 혈당·콜레스테롤 정밀 검사를 권장합니다. 수치가 개선되지 않으면 내과 전문의 상담을 받으세요."
                }
                """.formatted(
                fmt(c.getSystolicBp()), fmt(c.getDiastolicBp()),
                fmt(c.getFastingBloodSugar()),
                fmt(c.getTotalCholesterol()),
                fmt(c.getBmi())
        );
    }
}
