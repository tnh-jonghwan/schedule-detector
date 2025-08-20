import dotenv from 'dotenv';
dotenv.config();

// 환경변수 상수 정의
export const ENV = {
  // 데이터베이스 설정
  DATABASES: process.env.DATABASES,
  MAIN_USER: process.env.MAIN_USER,
  MAIN_PASSWORD: process.env.MAIN_PASSWORD,
  DEFAULT_HOST: process.env.DEFAULT_HOST,
  DEFAULT_PORT: process.env.DEFAULT_PORT,
  DEFAULT_USER: process.env.DEFAULT_USER,
  DEFAULT_PASSWORD: process.env.DEFAULT_PASSWORD,
  QUERY_TIMEOUT: process.env.QUERY_TIMEOUT,
  
  // 스케줄러 설정
  RUN_ONCE: process.env.RUN_ONCE,
  BATCH_SIZE: process.env.BATCH_SIZE,
  
  // Excel 내보내기 설정
  EXCEL_EXPORT: process.env.EXCEL_EXPORT,
  EXCEL_OUTPUT_DIR: process.env.EXCEL_OUTPUT_DIR,
  EXCEL_INCLUDE_TIMESTAMP: process.env.EXCEL_INCLUDE_TIMESTAMP,
  EXCEL_SEPARATE_SHEETS: process.env.EXCEL_SEPARATE_SHEETS,
  
  // Slack 알림 설정
  SLACK_ENABLED: process.env.SLACK_ENABLED,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_CHANNEL: process.env.SLACK_CHANNEL,
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  SLACK_VERIFICATION_TOKEN: process.env.SLACK_VERIFICATION_TOKEN,
} as const;