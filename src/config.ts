import dotenv from 'dotenv';
import { ENV } from './const.js';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  connectionLimit: number;
  queueLimit: number;
}

export interface Config {
  databases: DatabaseConfig[];
  batchSize: number;
  queryTimeout: number;
  scheduler: {
    runOnce: boolean;
  };
  excel: {
    enabled: boolean;
    outputDir: string;
    includeTimestamp: boolean;
    separateSheets: boolean;
  };
  slack: {
    enabled: boolean;
    token: string;
    channel: string;
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    verificationToken: string;
  };
}

dotenv.config();

let databases: Partial<DatabaseConfig>[] = [];
try {
  const dbEnv = ENV.DATABASES;
  if (dbEnv) {
    databases = JSON.parse(dbEnv.trim());
  }
} catch (error) {
  console.error('데이터베이스 환경변수 파싱 실패:', (error as Error).message);
  console.error('원본 값:', ENV.DATABASES);
  databases = [];
}

const config: Config = {
  databases: databases.map(db => ({
    host: db.host || ENV.DEFAULT_HOST || 'localhost',
    port: db.port || parseInt(ENV.DEFAULT_PORT || '3306'),
    user: ENV.MAIN_USER || ENV.DEFAULT_USER || '',
    password: ENV.MAIN_PASSWORD || ENV.DEFAULT_PASSWORD || '',
    connectionLimit: 10,
    queueLimit: 0
  })),
  batchSize: parseInt(ENV.BATCH_SIZE || '100'),
  queryTimeout: parseInt(ENV.QUERY_TIMEOUT || '30000'),
  scheduler: {
    runOnce: ENV.RUN_ONCE === 'true'
  },
  excel: {
    enabled: ENV.EXCEL_EXPORT === 'true',
    outputDir: ENV.EXCEL_OUTPUT_DIR || './exports',
    includeTimestamp: ENV.EXCEL_INCLUDE_TIMESTAMP !== 'false',
    separateSheets: ENV.EXCEL_SEPARATE_SHEETS !== 'false'
  },
  slack: {
    enabled: ENV.SLACK_ENABLED === 'true',
    token: ENV.SLACK_BOT_TOKEN || '',
    channel: ENV.SLACK_CHANNEL || '',
    clientId: ENV.SLACK_CLIENT_ID || '2863310822469.9322807165974',
    clientSecret: ENV.SLACK_CLIENT_SECRET || 'a13cf836bb302cdd65f16dd8bbf2abf7',
    signingSecret: ENV.SLACK_SIGNING_SECRET || '20afecb9d86c1ea0f4d3adc21ce59d33',
    verificationToken: ENV.SLACK_VERIFICATION_TOKEN || 'mCksmCkxgs51pTJGqwnat7Ub'
  }
};

export default config;