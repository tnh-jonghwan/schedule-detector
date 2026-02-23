# Medichis Schedule Detector

의료 기록 시스템에서 스케줄링 이상을 탐지하는 MySQL 배치 처리 서비스입니다.

## 🚀 사용법

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 설정 값을 환경에 맞게 작성하세요.

```bash
cp .env.example .env
```

### 3. 실행

`pnpm start` 명령어로 실행하면 **한 번 감지 후 종료**됩니다.  
반복 실행은 **crontab**으로 스케줄링하세요.

```bash
pnpm start
```

---

## ⏰ 자동화 실행 방법 (Crontab 사용)

한국 시간 기준 **오전 9시부터 오후 6시까지 매 30분 간격** 자동 실행 설정 방법입니다.

### 1. crontab 편집

```bash
crontab -e
```

### 2. 아래 내용을 자신의 환경에 맞게 수정 후 붙여넣기

```bash
PATH=/home/{USER}/.nvm/versions/node/v24.13.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# m h  dom mon dow   command
*/30 9-18 * * * cd /home/{USER}/workspace/schedule-detector && pnpm start >> /home/{USER}/workspace/schedule-detector/cron.log 2>&1
```

> **PATH 설정이 중요합니다.** cron 환경에서는 nvm으로 설치된 node를 인식하지 못하므로 반드시 PATH를 명시해야 합니다.

실행 기록과 에러 내용은 `cron.log` 파일에 저장됩니다.