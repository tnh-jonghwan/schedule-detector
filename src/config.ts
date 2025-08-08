import dotenv from 'dotenv';

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
    runIntervalHours: number;
    runOnce: boolean;
  };
  excel: {
    enabled: boolean;
    outputDir: string;
    includeTimestamp: boolean;
    separateSheets: boolean;
  };
}

dotenv.config();

let databases: Partial<DatabaseConfig>[] = [];
try {
  const dbEnv = process.env.DATABASES;
  if (dbEnv) {
    databases = JSON.parse(dbEnv.trim());
  }
} catch (error) {
  console.error('데이터베이스 환경변수 파싱 실패:', (error as Error).message);
  console.error('원본 값:', process.env.DATABASES);
  databases = [];
}

const config: Config = {
  databases: databases.map(db => ({
    host: db.host || process.env.DEFAULT_HOST || 'localhost',
    port: db.port || parseInt(process.env.DEFAULT_PORT || '3306'),
    user: process.env.MAIN_USER || process.env.DEFAULT_USER || '',
    password: process.env.MAIN_PASSWORD || process.env.DEFAULT_PASSWORD || '',
    connectionLimit: 10,
    queueLimit: 0
  })),
  batchSize: parseInt(process.env.BATCH_SIZE || '100'),
  queryTimeout: parseInt(process.env.QUERY_TIMEOUT || '30000'),
  scheduler: {
    runIntervalHours: parseInt(process.env.RUN_INTERVAL_HOURS || '1'),
    runOnce: process.env.RUN_ONCE === 'true'
  },
  excel: {
    enabled: process.env.EXCEL_EXPORT === 'true',
    outputDir: process.env.EXCEL_OUTPUT_DIR || './exports',
    includeTimestamp: process.env.EXCEL_INCLUDE_TIMESTAMP !== 'false',
    separateSheets: process.env.EXCEL_SEPARATE_SHEETS !== 'false'
  }
};

export default config;