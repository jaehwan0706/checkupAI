# 검진AI (CheckupAI)

건강검진 결과를 AI로 해석해주고, 이후의 생활습관(식단·운동·수치 기록)까지 관리하는 개인 건강관리 플랫폼입니다. 웹앱, Spring Boot 백엔드, React Native 모바일 앱으로 구성되어 있습니다.

## 무엇을 하는 서비스인가

- **검진 결과 해석**: PDF로 받은 건강검진표를 업로드하면 파싱 후 AI(Gemini)가 수치를 해석해 리포트를 생성합니다.
- **일상 기록**: 혈압/혈당 등 바이탈 수치, 식단, 약국봉투·병원 진료 기록을 남기고 추이를 확인합니다.
- **건강 목표 관리**: 목표를 세우고 체크인하며 진행률을 실시간으로 계산합니다.
- **AI 코칭**: 기록을 바탕으로 생활습관 가이드와 맞춤 피드백을 제공합니다.
- **알림 / 프리미엄**: 검진 주기 리마인더, 알림 설정, 카카오 로그인, 토스페이먼츠 결제(단건/월간 구독)를 지원합니다.

## 프로젝트 구성

```
검진AI/
├── back/      Spring Boot 3.3 백엔드 (Java 21, MySQL, JWT, JPA)
├── front/     React 19 웹앱 (react-scripts, 라우팅 없이 상태 기반 화면 전환)
├── mobile/    Expo(React Native) 모바일 앱 (TypeScript)
└── landing/   서비스 소개 랜딩 페이지 (정적 HTML)
```

### 백엔드 (`back/`)

- Spring Boot 3.3 · Java 21 · Spring Security(JWT) · Spring Data JPA · MySQL
- 카카오 OAuth2 소셜 로그인, 토스페이먼츠 결제 연동
- PDF 파싱(PDFBox)으로 검진표 업로드 → 자동 데이터 추출
- Gemini API로 AI 분석 리포트 생성 (`gemini-2.5-flash`)
- 도메인 패키지: `ai`, `checkup`, `daily`, `goal`, `guide`, `meal`, `medical`, `notification`, `payment`, `pdf`, `report`, `user`, `vitals`
- 로컬 포트: `8081`

주요 API:

| 영역 | 엔드포인트 |
| --- | --- |
| 인증 | `POST /api/auth/signup`, `POST /api/auth/login` |
| 사용자 | `GET/PUT /api/user/me` |
| 홈/알림 | `GET /api/home`, `GET /api/notifications` |
| 검진 | `POST/GET /api/checkup`, `GET /api/checkup/latest`, `GET /api/checkup/{id}` |
| PDF | `POST /api/pdf/parse-and-save` |
| 바이탈 | `GET/POST /api/vitals`, `GET /api/vitals/history` |
| 진료 기록 | `GET /api/medical-records/history`, `POST /api/medical-records` |
| AI 분석 | `POST /api/ai/analyze`, `/api/ai/analyze/daily`, `/api/ai/analyze/medical?type=PHARMACY\|HOSPITAL` |
| 결제 | `POST /api/payment/confirm`, `/api/payment/monthly` |
| 목표 | `GET/POST /api/goals` |

### 웹앱 (`front/`)

- React 19, `react-router-dom` 및 자체 상태 기반 화면 전환(App.jsx)
- 주요 화면: Splash, Onboarding, 로그인/회원가입, Home, 검진/기록 입력(Input), Report, Daily, Health Goal, History, Mypage, 알림 설정, 프리미엄 결제 등
- `localStorage`로 토큰/유저/프리미엄 상태 관리, 카카오 로그인은 `/?token=JWT` 리다이렉트 방식
- 개발 서버 포트: `3000`

### 모바일 앱 (`mobile/`)

- Expo SDK 53 · React Native 0.79 · TypeScript
- React Navigation v7 (native-stack + bottom-tabs), Zustand 전역 상태, `expo-secure-store`로 토큰 저장
- 하단 5탭(홈/입력/리포트/건강/기록) + Splash → Onboarding → Auth → ExtraInfo → Main 네비게이션 구조

### 랜딩 페이지 (`landing/`)

- 서비스 소개용 정적 HTML 페이지

## 시작하기

### 백엔드

```bash
cd back
./gradlew bootRun
```

- MySQL에 `checkupai` 데이터베이스/유저가 필요합니다 (`application.properties`의 `spring.datasource.*` 참고).
- Gemini API 키 등 민감한 값은 git에 포함되지 않는 `application-local.properties`에 설정합니다.

### 웹앱

```bash
cd front
npm install
npm start
```

### 모바일 앱

```bash
cd mobile
npm install
npx expo start
```

## 기술 스택 요약

| 영역 | 스택 |
| --- | --- |
| 백엔드 | Spring Boot 3.3, Java 21, Spring Security(JWT), JPA, MySQL, PDFBox, OkHttp |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| 웹 | React 19, react-router-dom, axios, recharts |
| 모바일 | Expo 53, React Native 0.79, TypeScript, React Navigation v7, Zustand |
| 인증/결제 | 카카오 OAuth2, 토스페이먼츠 |
