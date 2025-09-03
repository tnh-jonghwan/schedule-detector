import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
  DetectionResult,
  DetectionRow,
  HospitalMap,
  QUERY_TYPE_INFO,
  FIELD_NAME_MAPPING,
} from '../types/types.js';

export interface ExcelExportOptions {
  outputDir?: string;
  includeTimestamp?: boolean;
  separateSheets?: boolean;
}

export class ExcelService {
  private defaultOptions: Required<ExcelExportOptions> = {
    outputDir: './exports',
    includeTimestamp: true,
    separateSheets: true,
  };

  constructor(private options: ExcelExportOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.options.outputDir!)) {
      fs.mkdirSync(this.options.outputDir!, { recursive: true });
    }
  }

  private generateFileName(baseName: string): string {
    if (this.options.includeTimestamp) {
      const now = new Date();
      // 한국 시간으로 변환 (UTC+9)
      const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);

      const year = koreaTime.getUTCFullYear();
      const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(koreaTime.getUTCDate()).padStart(2, '0');
      const hour = String(koreaTime.getUTCHours()).padStart(2, '0');
      const minute = String(koreaTime.getUTCMinutes()).padStart(2, '0');

      const timestamp = `_${year}${month}${day}_${hour}${minute}`;
      return `${baseName}${timestamp}.xlsx`;
    }

    return `${baseName}.xlsx`;
  }

  private formatRowForExcel(
    row: DetectionRow,
    dbName: string
  ): Record<string, any> {
    const hospitalName = HospitalMap[dbName]?.hospitalName || '알 수 없는 병원';

    // 필드명을 한국어로 변환
    const koreanRow: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const koreanKey = FIELD_NAME_MAPPING[key] || key;
      koreanRow[koreanKey] = value;
    }

    return {
      병원코드: dbName,
      병원명: hospitalName,
      ...koreanRow,
    };
  }

  async exportAllResults(allResults: DetectionResult[]): Promise<string> {
    this.ensureOutputDir();

    const workbook = XLSX.utils.book_new();

    if (this.options.separateSheets) {
      // 각 쿼리별로 별도 시트 생성
      const queryResults = this.groupResultsByQuery(allResults);

      for (const [queryName, results] of queryResults) {
        const allRows: Record<string, any>[] = [];

        for (const result of results) {
          if (result.count > 0) {
            const formattedRows = result.rows.map(row =>
              this.formatRowForExcel(row, result.dbName)
            );
            allRows.push(...formattedRows);
          }
        }

        if (allRows.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(allRows);

          const colWidths = this.calculateColumnWidths(allRows);
          worksheet['!cols'] = colWidths;

          // 시트명을 한국어로 변환
          const sheetName = this.getQueryDescription(queryName);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      }
    } else {
      // 모든 결과를 하나의 시트에
      const allRows: Record<string, any>[] = [];

      for (const result of allResults) {
        if (result.count > 0) {
          const formattedRows = result.rows.map(row =>
            this.formatRowForExcel(row, result.dbName)
          );
          allRows.push(...formattedRows);
        }
      }

      if (allRows.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(allRows);

        const colWidths = this.calculateColumnWidths(allRows);
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, '전체결과');
      }
    }

    // 파일 저장
    const fileName = this.generateFileName('스케줄 감지');
    const filePath = path.join(this.options.outputDir!, fileName);
    XLSX.writeFile(workbook, filePath);

    const totalRows = allResults.reduce((sum, result) => sum + result.count, 0);
    console.log(`Excel 파일이 생성되었습니다: ${filePath} (총 ${totalRows}행)`);
    return filePath;
  }

  private groupResultsByQuery(
    results: DetectionResult[]
  ): Map<string, DetectionResult[]> {
    const grouped = new Map<string, DetectionResult[]>();

    for (const result of results) {
      if (!grouped.has(result.queryName)) {
        grouped.set(result.queryName, []);
      }
      grouped.get(result.queryName)!.push(result);
    }

    return grouped;
  }

  private getQueryDescription(queryName: string): string {
    return (
      QUERY_TYPE_INFO[queryName as keyof typeof QUERY_TYPE_INFO]
        ?.excelSheetName || queryName
    );
  }

  private calculateColumnWidths(data: Record<string, any>[]): XLSX.ColInfo[] {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const widths: XLSX.ColInfo[] = [];

    for (const key of keys) {
      let maxWidth = key.length;

      for (const row of data) {
        const cellValue = String(row[key] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      }

      // 최소 10, 최대 50으로 제한
      widths.push({ width: Math.min(Math.max(maxWidth + 2, 10), 50) });
    }

    return widths;
  }
}
