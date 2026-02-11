# 🩺 LOA Doctor (로아 닥터)

**LOA Doctor**는 로스트아크 플레이어들이 더 효율적이고 편안하게 게임을 즐길 수 있도록 돕는 웹 기반 보조 도구입니다.  
실시간 화면 공유를 통한 **레이드 공략 가이드(PiP)**와 제작 수익을 극대화하는 **스마트 제작 계산기** 기능을 제공합니다.

---

## ✨ 주요 기능 (Features)

### 1. 🛠️ Smart Crafting (스마트 제작 계산기)
- **실시간 시세 연동**: 로스트아크 Open API를 통해 재료 및 제작품의 최신 시세를 자동으로 불러옵니다.
- **최적 수익 분석 (Profit Analysis)**:
  - **제작 비용 vs 판매 수익**: 경매장 수수료(5%)를 고려한 순수익 계산
  - **사용 가치 분석**: 본인이 직접 사용할 경우의 이득 계산
  - **시간당 수익(Gold/Hour)**: 제작 소요 시간을 고려하여 가장 효율적인 제작 방식을 제안
- **보너스 설정**: 영지 효과(제작 비용 감소, 대성공 확률), 니나브의 축복, 제작 가속 효과 적용 가능
- **제작 히스토리**: 과거 제작 기록을 저장하고, 실제 결과(대성공 등)를 입력하여 확정 수익을 관리
- **PiP 모드**: 게임 화면 위에 띄워두고 실시간으로 타이머와 수익을 확인

### 2. 👁️ Raid Overlay (레이드 오버레이) - *Experimental*
- **실시간 화면 인식**: WebRTC 화면 공유를 통해 보스 체력바와 패턴을 인식
- **OCR & OpenCV**: Tesseract.js와 OpenCV를 활용하여 체력(줄수) 및 기믹 텍스트 추출
- **자동 가이드**: 현재 체력 줄수에 맞는 공략 힌트를 PiP 윈도우에 자동 표시
- **지원 레이드**:
  - 1막 : 에기르 (노말 1, 2관문)
  - 2막 : 아브렐슈드 (노말 1, 2관문)

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
