# Medichis Schedule Detector

의료 기록 시스템에서 스케줄링 이상을 탐지하는 MySQL 배치 처리 서비스입니다.

## 🚀 사용법

### 1. 의존성 설치

```bash
# pnpm 설치 (권장)
pnpm install
```

### 2. 환경 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 설정 값을 환경에 맞게 작성하세요.

```bash
cp .env.example .env
```

### 3. 스크립트 실행

다음 명령어를 통해 직접 실행할 수 있습니다:

```bash
# 프로덕션 실행
pnpm start
```

---

## ⏰ 자동화 실행 방법 (Crontab 사용)

한국 시간 기준 평일, 주말 관계없이 **오전 9시부터 오후 6시까지 매 30분 간격**으로 자동으로 스크립트가 실행되도록 설정하려면 `crontab`을 사용합니다.

1. 서버(또는 로컬 PC) 터미널을 열고 크론탭 수정 모드에 진입합니다:

```bash
crontab -e
```

2. 파일 맨 아래에 다음 내용을 추가합니다 (경로는 사용자 환경에 맞게 조정되었음):

```bash
# 평일과 주말 상관없이 매일 09:00 ~ 18:00 동안 30분 간격으로 실행
*/30 9-18 * * * cd /home/jongdeug/workspace/schedule-detector && /home/jongdeug/.nvm/versions/node/v24.13.1/bin/pnpm start >> /home/jongdeug/workspace/schedule-detector/cron.log 2>&1
```

3. 저장하고 닫습니다. 이제 지정된 시간에 자동으로 스크립트가 실행되며 실행 기록 및 에러 내용은 `cron.log` 파일에 저장됩니다.