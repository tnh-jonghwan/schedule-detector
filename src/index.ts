import { ScheduleDetectorService } from './services/scheduleDetector.service.js';

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

async function main(): Promise<void> {
  console.log(`===== 메디씨 데이터 불일치 감지 결과 =====\n[${formatTime()}]`);

  try {
    const detector = new ScheduleDetectorService();
    await detector.run();
  } catch (error) {
    console.error(`[${formatTime()}] 배치 처리 중 오류 발생:`, error);
    process.exit(1);
  }
}

main().catch(console.error);
