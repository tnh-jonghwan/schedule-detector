import { createPool, Pool } from 'mysql2/promise';
import { DatabaseConfig } from '../config.js';

export class DatabaseService {
  private pools: Map<string, Pool>;

  constructor() {
    this.pools = new Map();
  }

  async initializePools(databases: DatabaseConfig[]): Promise<void> {
    for (const dbConfig of databases) {
      try {
        const pool = createPool(dbConfig);
        this.pools.set(`${dbConfig.host}:${dbConfig.port}`, pool);
      } catch (error) {
        console.error(`✗ 데이터베이스 연결 실패 ${dbConfig.host}:${dbConfig.port}:`, (error as Error).message);
      }
    }
  }

  async executeQuery<T = any>(dbRoute: string, query: string, params: any[] = []): Promise<T[]> {
    const pool = this.pools.get(dbRoute);
    if (!pool) {
      throw new Error(`풀을 찾을 수 없습니다: ${dbRoute}`);
    }

    try {
      const [rows] = await pool.execute(query, params);
      return rows as T[];
    } catch (error) {
      console.error('쿼리 실행 에러:', (error as Error).message);
      throw error;
    }
  }

  getPoolRoutes(): string[] {
    return Array.from(this.pools.keys());
  }

  getPoolsSize(): number {
    return this.pools.size;
  }

  async closePools(): Promise<void> {
    for (const [dbRoute, pool] of this.pools) {
      try {
        await pool.end();
      } catch (error) {
        console.error(`✗ ${dbRoute} 풀 종료 에러:`, (error as Error).message);
      }
    }
  }
}