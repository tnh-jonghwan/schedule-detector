import config from './config.js';
import { ScheduleDetectorService } from './services/scheduleDetector.service.js';
import * as cron from 'node-cron';

function formatTime(): string {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

async function runDetection(): Promise<void> {
  try {
    const detector = new ScheduleDetectorService();
    await detector.run();
  } catch (error) {
    console.error(`[${formatTime()}] 배치 처리 중 오류 발생:`, error);
  }
}

async function main(): Promise<void> {
  console.log(`===== 메디씨 데이터 불일치 감지 결과 =====\n[${formatTime()}]`);
  console.log(`스케줄: 오전 9시, 오후 2시 (한국 시간)`);
  console.log(`한 번만 실행: ${config.scheduler.runOnce ? '예' : '아니오'}\n`);

  // 한 번만 실행하는 경우
  if (config.scheduler.runOnce) {
    console.log('한 번만 실행 모드로 실행 후 종료합니다.');
    await runDetection();
    return;
  }

  // 한국 시간 기준 오전 9시부터 오후 6시까지 30분 주기 실행
  console.log('크론 스케줄러를 시작합니다...');

  cron.schedule(
    '0,30 9-18 * * *',
    async () => {
      console.log(`[${formatTime()}] 30분 주기 정기 실행 시작`);
      await runDetection();
    },
    {
      timezone: 'Asia/Seoul',
    }
  );

  console.log('스케줄러가 시작되었습니다. 다음 실행 시간을 기다리는 중...');

  // 프로세스 종료 시 정리
  process.on('SIGINT', () => {
    console.log('\n프로그램을 종료합니다...');
    process.exit(0);
  });
}

main().catch(console.error);
