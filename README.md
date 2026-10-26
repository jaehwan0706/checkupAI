# 🩺 검진AI (CheckupAI) — 건강검진 결과 AI 해석 · 생활 건강관리 플랫폼

> 건강검진 결과 PDF와 혈압·혈당 같은 생활 기록을 분석해, AI가 이해하기 쉬운 요약과 관리 가이드를 제공합니다.
> 진료나 약을 받아도 어떤 성분이 무엇에 좋은지, 어떻게 관리해야 하는지 알기 어려웠던 경험에서 시작했습니다.

- **기간**: 2026.06.09 – 2026.09.28 (개인 프로젝트)
- **인원**: 1명 · **역할**: 기획 · 백엔드 · 웹/앱 · 배포 전부
- **배포**: Web <!-- Vercel 주소를 여기에 입력 --> · API `https://checkupai-backend.onrender.com`

<br>

## 📌 주요 기능

| 기능 | 설명 |
| --- | --- |
| 검진 결과 해석 | 검진표 PDF 업로드 → 수치 자동 추출 → Gemini AI 리포트 생성 |
| 생활 기록 | 혈압·혈당 등 바이탈, 식단, 약국봉투·병원 진료 기록과 추이 확인 |
| 건강 목표 | 목표 설정·체크인, 진행률 계산, 주간 리포트 |
| AI 코칭 | 기록을 바탕으로 생활습관 가이드와 맞춤 피드백 |
| 결제 | 토스페이먼츠 단건(1,900원) · 월간(9,900원) 결제 |
| 회원 | 이메일 가입·로그인(JWT), 카카오 OAuth2 로그인, 알림 설정 |

<br>

## 🛠 기술 스택

| 구분 | 기술 |
| --- | --- |
| Backend | Java 21, Spring Boot 3.3, Spring Security(JWT), Spring Data JPA, OAuth2 Client, PDFBox, OkHttp |
| Database | MySQL (로컬) · PostgreSQL / Supabase (배포) |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Web | React 19, react-router-dom, axios, recharts |
| Mobile | Expo, React Native, TypeScript, React Navigation, Zustand |
| 결제·인증 | 토스페이먼츠, 카카오 OAuth2 |
| Infra | Render (Docker, 백엔드), Vercel (웹) |

<br>

## 🏗 프로젝트 구성

```
checkupAI/
├── back/      Spring Boot 백엔드 (도메인: ai, checkup, daily, goal, guide, meal,
│              medical, notification, payment, pdf, report, user, vitals)
├── front/     React 웹앱
├── mobile/    Expo(React Native) 앱 — 하단 5탭(홈/입력/리포트/건강/기록)
└── landing/   서비스 소개 랜딩 페이지
```

<br>

## 🔥 문제 해결

### 1. 병원마다 다른 검진 PDF에서 수치 추출

**문제**: 검진 PDF는 병원마다 항목명이 달라(예: `AST`/`GOT`, `LDL`/`저밀도`) 항목별 수치를 정확히 뽑기 어려움

**해결**
- PDFBox로 텍스트를 추출한 뒤, **별칭 키워드 정규식**(`AST|GOT`, `LDL|저밀도` 등)으로 항목 위치를 찾음
- 키워드 뒤 일정 범위 안에서 **상식적인 값 범위**(예: 수축기혈압 60~200)에 들어가는 첫 숫자만 채택해 엉뚱한 숫자를 거름
- **12개 항목 중 3개 이상** 추출될 때만 성공으로 처리, 서버에서 PDF·10MB 이하만 허용

**한계 (다음 과제)**: 스캔 PDF는 OCR이 없어 읽지 못하고, 추출값을 사용자가 확인·수정하는 단계가 아직 없음

### 2. 같은 수치에도 AI 총평이 매번 달라지고 응답이 잘리는 문제

**증상**: 같은 검진 수치를 넣어도 AI 총평이 호출마다 달라지거나, 답이 중간에 잘려 JSON 형식이 깨짐

**원인**
- 근거 수치 없이 자유 형식으로 답하게 한 프롬프트
- Gemini 2.5가 "생각(thinking)" 토큰에 출력 토큰을 써 버려 실제 답이 잘림

**해결**
- 추출한 검진 수치를 **근거 데이터로 함께 전달**
- `responseMimeType: application/json`으로 **JSON 응답 강제**
- `thinkingBudget = 0`으로 생각 토큰을 꺼서 출력 토큰을 답에 모두 사용
- 생성한 리포트는 DB에 저장해 재사용

### 3. 결제 금액 변조와 중복 승인 방지

- 클라이언트가 보낸 금액을 **서버의 고정 금액과 비교**해 다르면 거부
- 승인은 **서버에서 토스 승인 API를 직접 호출**
- `paymentKey`·`orderId`를 **unique 제약**으로 두어 같은 결제가 두 번 승인되지 않도록 차단

### 기술 선택 이유

| 선택 | 비교 대상 | 이유 |
| --- | --- | --- |
| Spring Boot | Node.js | 결제·권한처럼 정합성이 중요한 로직을 트랜잭션으로 관리 |
| Gemini | OpenAI | 무료 사용량이 넉넉해 개인 프로젝트에서 프롬프트 반복 테스트에 유리 |

<br>

## 📡 API 요약

| 영역 | 엔드포인트 |
| --- | --- |
| 인증 | `POST /api/auth/signup` · `/login` |
| 사용자 | `GET·PUT /api/user/me` |
| 검진 | `POST·GET /api/checkup` · `GET /api/checkup/latest` · `/{id}` |
| PDF | `POST /api/pdf/parse-and-save` |
| 바이탈 | `GET·POST /api/vitals` · `GET /api/vitals/history` |
| 진료 기록 | `GET /api/medical-records/history` · `POST /api/medical-records` |
| AI 분석 | `POST /api/ai/analyze` · `/analyze/daily` · `/analyze/medical` |
| 결제 | `POST /api/payment/confirm` · `/monthly` |
| 목표 | `GET·POST /api/goals` |

<br>

## ▶ 실행 방법

```bash
# 백엔드 (민감한 값은 application-local.properties 또는 환경변수로 설정)
cd back
./gradlew bootRun

# 웹
cd front && npm install && npm start

# 모바일
cd mobile && npm install && npx expo start
```

<br>

## 💡 배운 점

- AI 기능은 **근거 데이터와 출력 형식까지 설계**해야 안정적으로 동작한다는 것
- 결제처럼 돈이 걸린 로직은 **클라이언트 값을 믿지 않고 서버에서 검증**해야 한다는 것
