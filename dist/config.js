import dotenv from 'dotenv';
dotenv.config();
let databases = [];
try {
    const dbEnv = process.env.DATABASES;
    if (dbEnv) {
        databases = JSON.parse(dbEnv.trim());
    }
}
catch (error) {
    console.error('데이터베이스 환경변수 파싱 실패:', error.message);
    console.error('원본 값:', process.env.DATABASES);
    databases = [];
}
const config = {
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
    }
};
export default config;
//# sourceMappingURL=config.js.map