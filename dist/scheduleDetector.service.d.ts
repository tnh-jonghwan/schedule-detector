import { Pool } from 'mysql2/promise';
import { ScheduleRow } from './types.js';
declare class ScheduleDetectorService {
    private pools;
    constructor();
    initializePools(): Promise<void>;
    executeQuery<T = any>(pool: Pool, query: string, params?: any[]): Promise<T[]>;
    closePools(): Promise<void>;
    run(): Promise<void>;
    detectInvalidVisitTypeOfMainSchedule(dbRoute: string): Promise<Map<string, ScheduleRow[]>>;
}
export default ScheduleDetectorService;
//# sourceMappingURL=scheduleDetector.service.d.ts.map