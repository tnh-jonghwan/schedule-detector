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
BATCH_SIZE=100                   

# Excel 내보내기
EXCEL_EXPORT=true                # 엑셀 내보내기 설정
EXCEL_OUTPUT_DIR=./exports

# Slack 알림
SLACK_ENABLED=true               # 슬랙 알림 설정
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL=#your-channel
```

### 실행

```bash
# 의존성 설치
npm install

# 프로덕션 실행
npm start
```