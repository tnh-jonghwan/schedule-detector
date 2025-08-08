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
}
export interface DatabaseInfo {
    Database: string;
}
export interface ScheduleRow {
    PATID: string;
    PATNAME: string;
    CHARTNO: string;
    SCHID: string;
    MRID: string;
    CONSULTTIME: string;
    EMPLNAME: string;
    EMPLID: string;
    VISITTYPE: string;
}
//# sourceMappingURL=types.d.ts.map