# 🩺 LOA Doctor (로아 닥터)

**LOA Doctor**는 로스트아크 플레이어들이 더 효율적이고 편안하게 게임을 즐길 수 있도록 돕는 웹 기반 보조 도구입니다.  
**실시간 레이드 오버레이(Raid Overlay)**를 주 기능으로 제공하며, 부가 기능으로 **스마트 제작 계산기**를 지원합니다.

---

## ✨ 주요 기능 (Features)

### 1. �️ Raid Overlay (레이드 오버레이) - **Main Feature**
- **실시간 화면 인식**: WebRTC 화면 공유를 통해 보스 체력바와 패턴을 실시간으로 인식합니다.
- **스마트 공략 가이드**:
  - **OCR & OpenCV**: Tesseract.js와 OpenCV를 활용하여 보스의 체력(줄수) 및 주요 기믹 텍스트를 정밀하게 추출합니다.
  - **자동 힌트 표시**: 현재 진행 상황(줄수/기믹)에 맞춰 필요한 공략 핵심 요약과 파훼법을 PiP(Picture-in-Picture) 윈도우에 자동으로 띄워줍니다.
- **지원 레이드**:
  - 1막 : 에기르 (노말 1, 2관문)
  - 2막 : 아브렐슈드 (노말 1, 2관문)

### 2. �️ Smart Crafting (스마트 제작 계산기) - *Bonus Feature*
- **실시간 수익 분석**: 로스트아크 Open API 시세와 연동하여, 제작 시점의 **실시간 이득(골드)**을 계산합니다.
- **정밀한 이익 계산**:
  - **판매 수익 vs 사용 이득**: 경매장 수수료(5%)를 뗀 순수익과 본인이 직접 사용할 경우의 이득을 구분하여 보여줍니다.
  - **시간당 효율**: 제작 소요 시간 대비 시간당 수익(Gold/Hour)을 분석하여 최적의 제작 전략을 제시합니다.
- **편의 기능**:
  - **제작 타이머**: 실제 게임 내 제작 시간과 동기화된 타이머 제공
  - **히스토리 관리**: 과거 제작 기록을 저장하고, '대성공' 등의 실제 결과를 입력하여 확정된 수익을 추적 관리할 수 있습니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend (`/client`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (Custom Hooks for heavy logic)
- **Core Libs**:
  - `tesseract.js`: Browser-based OCR
  - `opencv.js`: Image Processing
  - `framer-motion`: UI Animations

### Backend (`/server`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Role**:
  - Raid Data Management (Bosses, Gates, Patterns)
  - API Proxy (if needed to bypass CORS or hide secrets)

---

## 🚀 시작하기 (Getting Started)

### 사전 요구사항 (Prerequisites)
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Lost Ark Open API Key (for Smart Crafting)

### 설치 (Installation)

1. **레포지토리 클론**
   ```bash
   git clone https://github.com/loa-doctor/loa-doctor.git
   cd loa-doctor
   ```

2. **Backend (Server) 설정**
   ```bash
   cd server
   npm install
   
   # .env 파일 생성 및 설정
   # PORT=4000
   # MONGO_URI=mongodb://localhost:27017/loa-doctor
   
   npm run dev
   ```

3. **Frontend (Client) 설정**
   ```bash
   cd client
   npm install
   
   # .env.local 파일 생성 (Optional)
   # NEXT_PUBLIC_API_URL=http://localhost:4000/api
   
   npm run dev
   ```

4. **접속**
   - 브라우저에서 `http://localhost:3000` 접속

---

## 📂 프로젝트 구조 (Structure)

```
loa-doctor/
├── client/                 # Frontend (Next.js)
│   ├── src/
│   │   ├── app/            # App Router Pages
│   │   ├── features/       # Feature-based Modules
│   │   │   ├── smart-crafting/ # 제작 계산기 관련 컴포넌트 & 훅
│   │   │   └── screen-capture/ # 화면 인식 & 오버레이 관련 로직
│   │   └── hooks/          # Shared Hooks (useOpenCV, etc.)
│   └── ...
├── server/                 # Backend (Express)
│   ├── src/
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # API Routes
│   │   └── scripts/        # Data Seeding & Maintenance Scripts
│   └── ...
└── README.md               # Main Documentation
```

---

## ⚠️ 참고 사항 (Disclaimer)
- 본 프로젝트는 **개인 학습 및 연구 목적**으로 개발되었습니다.
- 게임 클라이언트를 변조하거나 메모리를 읽지 않으며, **순수 화면 캡처(WebRTC)**만을 이용합니다.
- 스마트 제작 계산기의 시세 데이터는 로스트아크 공식 API를 사용합니다.

---

## 🤝 기여 (Contributing)
이슈 제보 및 PR은 언제나 환영합니다!
