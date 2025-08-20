# Medichis Schedule Detector

의료 기록 시스템에서 스케줄링 이상을 탐지하는 MySQL 배치 처리 서비스입니다.

## 사용법

### 환경 설정

`.env` 파일을 생성하여 다음 설정을 추가하세요:

```bash
# 필수 설정
DATABASES='[{"host":"localhost","port":3306}]'
MAIN_USER=your_username
MAIN_PASSWORD=your_password

# 선택 설정
RUN_ONCE=true                    # 한 번만 실행 (기본값: false)
RUN_INTERVAL_HOURS=1             # 반복 실행 간격 (기본값: 1시간)
BATCH_SIZE=100                   # 배치 크기 (기본값: 100)

# Excel 내보내기
EXCEL_EXPORT=true
EXCEL_OUTPUT_DIR=./exports

# Slack 알림
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL=#your-channel
```

### 실행

```bash
# 의존성 설치
npm install

# 개발 모드 (파일 변경 감지)
npm run dev

# 프로덕션 실행
npm start

# 빌드 후 실행
npm run build
node dist/index.js
```

### 유틸리티

```bash
npm run typecheck  # 타입 체크
npm run clean      # 빌드 디렉토리 정리
```