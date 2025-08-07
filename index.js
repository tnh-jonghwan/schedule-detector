import config from './config.js';
import ScheduleDetectorService from './scheduleDetector.service.js';

function formatTime() {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function runDetection() {
  try {
    const detector = new ScheduleDetectorService();
    await detector.run();
  } catch (error) {
    console.error(`[${formatTime()}] 배치 처리 중 오류 발생:`, error);
  }
}

async function main() {
  console.log(`===== 메디치스 스케줄 감지기 =====\n[${formatTime()}]`);
  console.log(`실행 간격: ${config.scheduler.runIntervalHours}시간`);
  console.log(`한 번만 실행: ${config.scheduler.runOnce ? '예' : '아니오'}\n`);
  
  // 첫 번째 실행
  await runDetection();
  
  // 한 번만 실행하는 경우
  if (config.scheduler.runOnce) {
    console.log('한 번만 실행 모드로 종료합니다.');
    return;
  }
  
  // 주기적 실행
  const intervalMs = config.scheduler.runIntervalHours * 60 * 60 * 1000;
  console.log(`${config.scheduler.runIntervalHours}시간마다 반복 실행합니다...`);
  
  setInterval(async () => {
    await runDetection();
  }, intervalMs);
  
  // 프로세스 종료 시 정리
  process.on('SIGINT', () => {
    console.log('\n프로그램을 종료합니다...');
    process.exit(0);
  });
}

main().catch(console.error);