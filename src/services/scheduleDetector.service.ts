import config from '../config.js';
import { DatabaseService } from './database.service.js';
import { ExcelService } from './excel.service.js';
import { 
  DatabaseInfo, 
  DetectionQuery, 
  DetectionResult, 
  DetectionRow,
  ScheduleRow,
  InsuranceMismatchRow,
  DoctorMismatchRow,
  DateMismatchRow,
  HospitalMap
} from '../types/database.js';

export class ScheduleDetectorService {
  private dbService: DatabaseService;
  private excelService: ExcelService;
  private startDate: string;
  private detectionQueries: DetectionQuery[];

  constructor() {
    this.dbService = new DatabaseService();
    this.excelService = new ExcelService({
      outputDir: config.excel.outputDir,
      includeTimestamp: config.excel.includeTimestamp,
      separateSheets: config.excel.separateSheets
    });
    this.startDate = "20250501";
    this.detectionQueries = this.initializeDetectionQueries();
  }

  private initializeDetectionQueries(): DetectionQuery[] {
    return [
      {
        name: 'invalidVisitType',
        description: '주스케줄 진료구분이 초, 재초, 재가 아닌 경우',
        query: `SELECT P.PATID, P.PATNAME, P.CHARTNO, S.SCHID, M.MRID, M.CONSULTTIME, E.EMPLNAME, E.EMPLID, S.VISITTYPE
                FROM {dbName}.TSCHEDULE S
                JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                JOIN {dbName}.TMEDICALRECORD M ON M.SCHID = S.SCHID
                JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = M.DRID
                WHERE S.ORGSCHID = 0 
                AND S.SCHTYPE = 2
                AND S.VISITTYPE NOT IN (0,1,2,3)
                AND S.SCHDATE >= ?`,
        enabled: true
      },
      {
        name: 'insuranceMismatch',
        description: '자격조회 환자 매칭 안되는 경우',
        query: `SELECT H.INSID, P.PATID, P.PATNAME, P.CHARTNO
                FROM {dbName}.TSCHEDULE S
                JOIN {dbName}.THEALTHINSURANCE H ON H.SCHID = S.SCHID
                JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                WHERE S.PATID != H.PATID
                AND S.SCHDATE >= ?`,
        enabled: true
      },
      {
        name: 'doctorMismatch',
        description: '스케줄의 담당의와 차트의 담당의가 매칭 안되는 경우',
        query: `SELECT P.PATID, P.PATNAME, P.CHARTNO, S.SCHID, M.MRID, M.CONSULTTIME, E.EMPLNAME, E.EMPLID
                 FROM {dbName}.TSCHEDULE S
                 JOIN {dbName}.TPROCSLIP PR ON PR.SCHID = S.SCHID AND PR.SLPTYPE IN (2, 3)
                 JOIN {dbName}.TMEDICALRECORD M ON M.MRID = PR.MRID
                 JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                 JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = M.DRID
                 WHERE S.SCHTYPE = 2
                 AND PR.DRID != M.DRID
                 AND S.SCHDATE >= ?`,
        enabled: true
      },
      {
        name: 'dateMismatch',
        description: '외래만, 스케줄과 차트날짜가 다른 경우',
        query: `SELECT P.PATID, P.PATNAME, P.CHARTNO, S.SCHID, M.MRID, M.CONSULTTIME, E.EMPLID, E.EMPLNAME
                FROM {dbName}.TSCHEDULE S 
                JOIN {dbName}.TMEDICALRECORD M ON M.SCHID = S.SCHID
                JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = M.DRID
                WHERE S.SCHTYPE = 1
                AND S.SCHDATE >= ?
                AND S.SCHDATE != SUBSTR(M.CONSULTTIME, 1, 8)`,
        enabled: true
      }
    ];
  }

  private logResults(queryName: string, rows: DetectionRow[]): void {
    console.log(`\n=== ${queryName} 결과 (${rows.length}건) ===`);
    for (const row of rows) {
      const fields = Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      console.log(fields);
    }
  }

  private async executeDetectionQuery(
    dbRoute: string, 
    dbName: string, 
    detectionQuery: DetectionQuery
  ): Promise<DetectionResult> {
    const query = detectionQuery.query.replace(/{dbName}/g, dbName);
    
    try {
      const rows = await this.dbService.executeQuery<DetectionRow>(dbRoute, query, [this.startDate]);
      
      const result: DetectionResult = {
        queryName: detectionQuery.name,
        dbRoute,
        dbName,
        rows,
        count: rows.length
      };

      if (rows.length > 0) {
        this.logResults(detectionQuery.description, rows.map(row => ({ DBNAME: dbName, HOSNAME: HospitalMap[dbName].hospitalName, ...row })));
      }

      return result;
    } catch (error) {
      console.error(`${detectionQuery.name} 쿼리 실행 에러 (${dbRoute} - ${dbName}):`, (error as Error).message);
      return {
        queryName: detectionQuery.name,
        dbRoute,
        dbName,
        rows: [],
        count: 0
      };
    }
  }

  private async runDetectionForDatabase(dbRoute: string, dbName: string): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    
    console.log(`\n데이터베이스 처리 중: ${dbRoute} - ${dbName}`);
    
    for (const query of this.detectionQueries) {
      if (query.enabled) {
        const result = await this.executeDetectionQuery(dbRoute, dbName, query);
        results.push(result);
      }
    }
    
    return results;
  }

  async run(): Promise<void> {
    try {
      await this.dbService.initializePools(config.databases);
      
      if (this.dbService.getPoolsSize() === 0) {
        console.log('사용 가능한 데이터베이스 연결이 없습니다. 종료합니다...');
        return;
      }

      const allResults: DetectionResult[] = [];
     
      for (const dbRoute of this.dbService.getPoolRoutes()) {
        const databases = await this.dbService.executeQuery<DatabaseInfo>(dbRoute, 'SHOW DATABASES');

        for (const database of databases) {
          const dbName = database.Database;
          
          if (dbName === 'amelia' || (dbName.length === 6 && dbName.substring(0, 1) === 'c')) {
            const results = await this.runDetectionForDatabase(dbRoute, dbName);
            allResults.push(...results);
          }
        }
      }

      // 결과 요약 출력
      this.printSummary(allResults);

      // Excel 파일 생성 (활성화된 경우)
      if (config.excel.enabled && allResults.some(r => r.count > 0)) {
        try {
          await this.excelService.exportAllResults(allResults);
        } catch (error) {
          console.error('Excel 파일 생성 중 오류 발생:', (error as Error).message);
        }
      }
      
    } catch (error) {
      console.error('배치 처리 실패:', error);
    } finally {
      await this.dbService.closePools();
    }
  }

  private printSummary(results: DetectionResult[]): void {
    console.log('\n=== 감지 결과 요약 ===');
    
    const summary = new Map<string, number>();
    let totalCount = 0;

    for (const result of results) {
      const current = summary.get(result.queryName) || 0;
      summary.set(result.queryName, current + result.count);
      totalCount += result.count;
    }

    const queryDescriptions = new Map(
      this.detectionQueries.map(q => [q.name, q.description])
    );

    for (const [queryName, count] of summary) {
      const description = queryDescriptions.get(queryName) || queryName;
      console.log(`${description}: ${count}건`);
    }

    console.log(`\n총 ${totalCount}건 감지되었습니다.`);
  }

  // 특정 쿼리만 실행하는 메서드
  async runSpecificDetection(queryName: string): Promise<DetectionResult[]> {
    const query = this.detectionQueries.find(q => q.name === queryName);
    if (!query) {
      throw new Error(`쿼리를 찾을 수 없습니다: ${queryName}`);
    }

    await this.dbService.initializePools(config.databases);
    const results: DetectionResult[] = [];

    try {
      for (const dbRoute of this.dbService.getPoolRoutes()) {
        const databases = await this.dbService.executeQuery<DatabaseInfo>(dbRoute, 'SHOW DATABASES');

        for (const database of databases) {
          const dbName = database.Database;
          
          if (dbName === 'amelia' || (dbName.length === 6 && dbName.substring(0, 1) === 'c')) {
            const result = await this.executeDetectionQuery(dbRoute, dbName, query);
            results.push(result);
          }
        }
      }
    } finally {
      await this.dbService.closePools();
    }

    return results;
  }

  // 쿼리 활성화/비활성화
  setQueryEnabled(queryName: string, enabled: boolean): void {
    const query = this.detectionQueries.find(q => q.name === queryName);
    if (query) {
      query.enabled = enabled;
    }
  }

  // 사용 가능한 쿼리 목록
  getAvailableQueries(): DetectionQuery[] {
    return [...this.detectionQueries];
  }

  // Excel 파일 수동 생성
  async exportToExcel(results: DetectionResult[]): Promise<string> {
    if (!results || results.length === 0) {
      throw new Error('결과 데이터가 없습니다. 먼저 감지를 실행하세요.');
    }

    return await this.excelService.exportAllResults(results);
  }

  // 특정 쿼리 결과만 Excel로 내보내기
  async exportSpecificQueryToExcel(queryName: string): Promise<string> {
    const results = await this.runSpecificDetection(queryName);
    return await this.excelService.exportSingleQuery(results, queryName);
  }
}