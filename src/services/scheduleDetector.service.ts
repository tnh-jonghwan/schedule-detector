import config from '../config.js';
import { DatabaseService } from './database.service.js';
import { ExcelService } from './excel.service.js';
import { SlackService } from './slack.service.js';
import {
  DatabaseInfo,
  DetectionQuery,
  DetectionResult,
  DetectionRow,
  HospitalMap,
  QUERY_TYPE,
  QUERY_TYPE_INFO,
  FIELD_NAME_MAPPING,
} from '../types/types.js';

export class ScheduleDetectorService {
  private dbService: DatabaseService;
  private excelService: ExcelService;
  private slackService: SlackService;
  private startDate: string;
  private detectionQueries: DetectionQuery[];

  constructor() {
    this.dbService = new DatabaseService();
    this.excelService = new ExcelService({
      outputDir: config.excel.outputDir,
      includeTimestamp: config.excel.includeTimestamp,
      separateSheets: config.excel.separateSheets,
    });
    this.slackService = new SlackService({
      enabled: config.slack.enabled,
      token: config.slack.token,
      channel: config.slack.channel,
    });
    this.startDate = '20250501';
    this.detectionQueries = this.initializeDetectionQueries();
  }

  private initializeDetectionQueries(): DetectionQuery[] {
    return [
      {
        name: QUERY_TYPE.INSURANCE_MISMATCH,
        description: QUERY_TYPE_INFO[QUERY_TYPE.INSURANCE_MISMATCH].description,
        query: `SELECT P.PATNAME, P.CHARTNO, SUBSTR(M.CONSULTTIME, 1, 8) AS CONSULTDATE, H.INSID, P.PATID, S.SCHID, M.MRID
                FROM {dbName}.TSCHEDULE S
                JOIN {dbName}.THEALTHINSURANCE H ON H.SCHID = S.SCHID
                JOIN {dbName}.TMEDICALRECORD M ON M.MRID = H.MRID
                JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                WHERE S.PATID != H.PATID
                AND S.SCHDATE >= ?`,
        enabled: true,
      },
      {
        name: QUERY_TYPE.CONSULTTIME_MISMATCH,
        description:
          QUERY_TYPE_INFO[QUERY_TYPE.CONSULTTIME_MISMATCH].description,
        query: `SELECT P.PATNAME, P.CHARTNO, S.SCHDATE, SUBSTR(M.CONSULTTIME, 1, 8) AS CONSULTDATE, E.EMPLNAME, P.PATID, S.SCHID, M.MRID, E.EMPLID
                FROM {dbName}.TSCHEDULE S 
                JOIN {dbName}.TMEDICALRECORD M ON M.SCHID = S.SCHID
                JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = M.DRID
                WHERE S.SCHTYPE = 1
                AND S.SCHDATE >= ?
                AND S.SCHDATE != SUBSTR(M.CONSULTTIME, 1, 8)`,
        enabled: true,
      },
      {
        name: QUERY_TYPE.DUPLICATE_SCHEDULE,
        description: QUERY_TYPE_INFO[QUERY_TYPE.DUPLICATE_SCHEDULE].description,
        query: `SELECT P.PATNAME, P.CHARTNO, A.SCHDATE, E.EMPLNAME, P.PATID, A.SCHID AS A_SCHID, B.SCHID AS B_SCHID
                FROM {dbName}.TSCHEDULE A
                JOIN {dbName}.TSCHEDULE B ON B.SCHDATE = A.SCHDATE AND B.SCHDRID = A.SCHDRID AND A.SCHID < B.SCHID AND A.INSTYPE = B.INSTYPE AND A.VISITTYPE = B.VISITTYPE AND B.VISITTYPE != 0 AND A.PATID = B.PATID AND A.ORGSCHID = B.ORGSCHID
                JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = A.SCHDRID
                JOIN {dbName}.TPATIENT P ON P.PATID = A.PATID 
                WHERE A.SCHTYPE = 2 AND B.SCHTYPE = 2 AND (A.SCHSTATUS != 20 AND B.SCHSTATUS != 20)
                AND A.SCHDATE >= "20250701"`,
        enabled: true,
      },

      // {
      //   name: QUERY_TYPE.DUPLICATE_SCHEDULE,
      //   description: QUERY_TYPE_INFO[QUERY_TYPE.DUPLICATE_SCHEDULE].description,
      //   query: `SELECT P.PATNAME, P.CHARTNO, A.SCHDATE, E.EMPLNAME, P.PATID, A.SCHID AS A_SCHID, B.SCHID AS B_SCHID
      //           FROM {dbName}.TSCHEDULE A
      //           JOIN {dbName}.TSCHEDULE B ON B.SCHDATE = A.SCHDATE AND B.SCHDRID = A.SCHDRID AND A.SCHID < B.SCHID AND A.INSTYPE = B.INSTYPE AND A.VISITTYPE = B.VISITTYPE AND B.VISITTYPE != 0 AND A.PATID = B.PATID
      //           JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = A.SCHDRID
      //           JOIN {dbName}.TPATIENT P ON P.PATID = A.PATID
      //           WHERE A.SCHTYPE = 2
      //           AND A.SCHDATE >= ?`,
      //   enabled: true,
      // },
      {
        name: QUERY_TYPE.SCHEDULE_TWIST,
        description: QUERY_TYPE_INFO[QUERY_TYPE.SCHEDULE_TWIST].description,
        query: `SELECT P.PATNAME, P.CHARTNO, SUBSTR(M.CONSULTTIME, 1, 8) AS CONSULTDATE, R.MRID, S.SCHID
                FROM {dbName}.TSCHEDULE S
                JOIN {dbName}.TPATIENT P
                    ON P.PATID = S.PATID
                JOIN {dbName}.TMEDICALRECORD M 
                    ON S.SCHID = M.SCHID 
                JOIN {dbName}.TRECORDCHGLOG R 
                    ON R.MRID = M.MRID
                WHERE S.SCHDATE >= ? 
                  AND S.SCHTYPE = 2
                GROUP BY R.MRID, S.SCHID
                HAVING SUM(R.SCHID) % S.SCHID <> 0;`,
        enabled: true,
      },
      {
        name: QUERY_TYPE.DUPLICATE_MEAL,
        description: QUERY_TYPE_INFO[QUERY_TYPE.DUPLICATE_MEAL].description,
        query: `SELECT P.PATNAME, P.CHARTNO, E.EMPLNAME, SUBSTR(M.CONSULTTIME, 1, 8) AS CONSULTDATE, I.ITEMNAME, COUNT(*) AS CNT, P.PATID, M.MRID
                FROM {dbName}.TSCHEDULE S
                JOIN {dbName}.TMEDICALRECORD M ON M.SCHID = S.SCHID
                JOIN {dbName}.TMEDICALITEM I ON I.MRID = M.MRID
                JOIN {dbName}.TPATIENT P ON P.PATID = M.PATID
                JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = M.DRID
                WHERE S.SCHDATE >= ?
                AND I.CATNO IN ("20001001", "20002001", "41003001", "51003001")
                GROUP BY M.MRID, I.CATNO, I.ITEMCODE
                HAVING COUNT(*) >= 2;`,
        enabled: true,
      },
      {
        name: QUERY_TYPE.SCHEDULE_VISITTYPE_MISMATCH,
        description:
          QUERY_TYPE_INFO[QUERY_TYPE.SCHEDULE_VISITTYPE_MISMATCH].description,
        query: `SELECT P.PATNAME, P.CHARTNO, E.EMPLNAME, S.SCHDATE, S.SCHID, S.SCHDRID
                FROM {dbName}.TSCHEDULE S
                JOIN {dbName}.TPATIENT P ON P.PATID = S.PATID
                JOIN {dbName}.TEMPLOYEE E ON E.EMPLID = S.SCHDRID
                WHERE S.SCHTYPE = 2
                AND S.SCHDATE >= ?
                AND S.ORGSCHID = 0 
                AND S.VISITTYPE IN (5, 6) 
                AND S.MIG = 0`,
        enabled: true,
      },
    ];
  }

  private logResults(queryName: string, rows: DetectionRow[]): void {
    console.log(`\n=== ${queryName} 결과 (${rows.length}건) ===`);
    for (const row of rows) {
      const fields = Object.entries(row)
        .map(([key, value]) => {
          const koreanKey = FIELD_NAME_MAPPING[key] || key;
          return `${koreanKey}: ${value}`;
        })
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
      const rows = await this.dbService.executeQuery<DetectionRow>(
        dbRoute,
        query,
        [this.startDate]
      );

      const result: DetectionResult = {
        queryName: detectionQuery.name,
        dbRoute,
        dbName,
        rows,
        count: rows.length,
      };

      if (rows.length > 0) {
        this.logResults(
          detectionQuery.description,
          rows.map(row => ({
            DBNAME: dbName,
            HOSNAME: HospitalMap[dbName].hospitalName,
            ...row,
          }))
        );
      }

      return result;
    } catch (error) {
      console.error(
        `${detectionQuery.name} 쿼리 실행 에러 (${dbRoute} - ${dbName}):`,
        (error as Error).message
      );
      return {
        queryName: detectionQuery.name,
        dbRoute,
        dbName,
        rows: [],
        count: 0,
      };
    }
  }

  private async runDetectionForDatabase(
    dbRoute: string,
    dbName: string
  ): Promise<DetectionResult[]> {
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
    let excelFilePath = '';

    try {
      await this.dbService.initializePools(config.databases);

      if (this.dbService.getPoolsSize() === 0) {
        console.log('사용 가능한 데이터베이스 연결이 없습니다. 종료합니다...');
        return;
      }

      const allResults: DetectionResult[] = [];

      for (const dbRoute of this.dbService.getPoolRoutes()) {
        const databases = await this.dbService.executeQuery<DatabaseInfo>(
          dbRoute,
          'SHOW DATABASES'
        );

        for (const database of databases) {
          const dbName = database.Database;

          if (
            dbName === 'amelia' ||
            (dbName.length === 6 && dbName.substring(0, 1) === 'c')
          ) {
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
          excelFilePath = await this.excelService.exportAllResults(allResults);
        } catch (error) {
          console.error(
            'Excel 파일 생성 중 오류 발생:',
            (error as Error).message
          );
        }
      }

      // Slack 알림 전송 (활성화된 경우)
      if (config.slack.enabled) {
        try {
          await this.slackService.sendDetectionResults(
            allResults,
            excelFilePath
          );
        } catch (error) {
          console.error(
            'Slack 알림 전송 중 오류 발생:',
            (error as Error).message
          );
        }
      }
    } catch (error) {
      console.error('배치 처리 실패:', error);

      // 에러 발생 시 Slack 알림
      if (config.slack.enabled) {
        try {
          await this.slackService.sendErrorMessage(error as Error);
        } catch (slackError) {
          console.error(
            'Slack 에러 알림 전송 실패:',
            (slackError as Error).message
          );
        }
      }
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
        const databases = await this.dbService.executeQuery<DatabaseInfo>(
          dbRoute,
          'SHOW DATABASES'
        );

        for (const database of databases) {
          const dbName = database.Database;

          if (
            dbName === 'amelia' ||
            (dbName.length === 6 && dbName.substring(0, 1) === 'c')
          ) {
            const result = await this.executeDetectionQuery(
              dbRoute,
              dbName,
              query
            );
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
}
