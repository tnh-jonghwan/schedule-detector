import { createPool } from 'mysql2/promise';
import config from './config.js';

class ScheduleDetectorService {
  constructor() {
    this.pools = new Map();
  }

  async initializePools() {
    for (const dbConfig of config.databases) {
      try {
        const pool = createPool(dbConfig);
        this.pools.set(dbConfig.host + ':' + dbConfig.port, pool);
      } catch (error) {
        console.error(`✗ 데이터베이스 연결 실패 ${dbConfig.host}:${dbConfig.port}:`, error.message);
      }
    }
  }

  async executeQuery(pool, query, params = []) {
    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('쿼리 실행 에러:', error.message);
      throw error;
    }
  }

  async closePools() {
    for (const [dbRoute, pool] of this.pools) {
      try {
        await pool.end();
      } catch (error) {
        console.error(`✗ ${dbRoute} 풀 종료 에러:`, error.message);
      }
    }
  }

  async run() {
    try {
      await this.initializePools();
      
      if (this.pools.size === 0) {
        console.log('사용 가능한 데이터베이스 연결이 없습니다. 종료합니다...');
        return;
      }

      let totalSchedules = 0;
     
      for (const [dbRoute, _] of this.pools) {
        const results = await this.detectInvalidVisitTypeOfMainSchedule(dbRoute);

        for (const [_, result] of results) {
          totalSchedules += result.length;
        }
      }

      console.log(`총 ${totalSchedules} 건 감지했습니다.`);
      
    } catch (error) {
      console.error('배치 처리 실패:', error);
    } finally {
      await this.closePools();
    }
  }


  // 주스케줄 진료구분 초, 재초, 재가 아닌 경우
  async detectInvalidVisitTypeOfMainSchedule(dbRoute) {
    const results = new Map();
    const pool = this.pools.get(dbRoute);
    const databases = await this.executeQuery(pool, 'SHOW DATABASES');

    for(const database of databases) {
      const dbName = database.Database; 

      if(dbName === 'amelia' || (dbName.length === 6 && dbName.substring(0, 1) === 'c'))  {
          console.log(`\n데이터베이스 처리 중: ${dbRoute} - ${dbName}`);

          try {
            const sqlFields = `SELECT P.PATID, P.PATNAME, P.CHARTNO, S.SCHID, M.MRID, M.CONSULTTIME, E.EMPLNAME, E.EMPLID, S.VISITTYPE
                                FROM ${dbName}.TSCHEDULE S
                                JOIN ${dbName}.TPATIENT P ON P.PATID = S.PATID
                                JOIN ${dbName}.TMEDICALRECORD M ON M.SCHID = S.SCHID
                                JOIN ${dbName}.TEMPLOYEE E ON E.EMPLID = M.DRID
                                WHERE S.ORGSCHID = 0 
                                AND S.VISITTYPE IN ('5','6')
                                AND S.SCHDATE >= "20250101";`;

            const rows = await this.executeQuery(pool, sqlFields, [config.batchSize]);
            results.set(dbRoute, rows);
            

            for (const row of rows) {
              console.log(`PATID: ${row.PATID}, PATNAME: ${row.PATNAME}, CHARTNO: ${row.CHARTNO}, SCHID: ${row.SCHID}, MRID: ${row.MRID}, CONSULTTIME: ${row.CONSULTTIME}, EMPLNAME: ${row.EMPLNAME}, EMPLID: ${row.EMPLID}, VISITTYPE: ${row.VISITTYPE}`);
            }
          } catch (error) {
            console.error(`${dbRoute} 처리 에러:`, error.message);
            results.set(dbRoute, []);
          }
      }
    }

    return results;
  }

}

export default ScheduleDetectorService;