import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { DetectionResult, DetectionRow, HospitalMap } from '../types/database.js';

export interface ExcelExportOptions {
  outputDir?: string;
  includeTimestamp?: boolean;
  separateSheets?: boolean;
}

export class ExcelService {
  private defaultOptions: Required<ExcelExportOptions> = {
    outputDir: './exports',
    includeTimestamp: true,
    separateSheets: true
  };

  constructor(private options: ExcelExportOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.options.outputDir!)) {
      fs.mkdirSync(this.options.outputDir!, { recursive: true });
    }
  }

  private generateFileName(queryName?: string): string {
    const timestamp = this.options.includeTimestamp 
      ? `_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_').replace(/-/g, '')}`
      : '';
    
    const baseName = queryName ? `${queryName}_detection` : 'schedule_detection';
    return `${baseName}${timestamp}.xlsx`;
  }

  private formatRowForExcel(row: DetectionRow, dbName: string, queryName: string): Record<string, any> {
    const hospitalName = HospitalMap[dbName]?.hospitalName || '알 수 없는 병원';
    
    return {
      '감지유형': queryName,
      '병원코드': dbName,
      '병원명': hospitalName,
      '감지일시': new Date().toLocaleString('ko-KR'),
      ...row
    };
  }

  async exportSingleQuery(results: DetectionResult[], queryName: string): Promise<string> {
    this.ensureOutputDir();
    
    const workbook = XLSX.utils.book_new();
    const allRows: Record<string, any>[] = [];

    // 모든 결과를 하나의 배열로 합치기
    for (const result of results) {
      if (result.count > 0) {
        const formattedRows = result.rows.map(row => 
          this.formatRowForExcel(row, result.dbName, result.queryName)
        );
        allRows.push(...formattedRows);
      }
    }

    if (allRows.length === 0) {
      console.log(`${queryName} 쿼리 결과가 없어 Excel 파일을 생성하지 않습니다.`);
      return '';
    }

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(allRows);
    
    // 컬럼 너비 자동 조정
    const colWidths = this.calculateColumnWidths(allRows);
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, queryName);

    // 파일 저장
    const fileName = this.generateFileName(queryName);
    const filePath = path.join(this.options.outputDir!, fileName);
    XLSX.writeFile(workbook, filePath);

    console.log(`Excel 파일이 생성되었습니다: ${filePath} (${allRows.length}행)`);
    return filePath;
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
              this.formatRowForExcel(row, result.dbName, result.queryName)
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
            this.formatRowForExcel(row, result.dbName, result.queryName)
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

    // 요약 시트 추가
    this.addSummarySheet(workbook, allResults);

    // 파일 저장
    const fileName = this.generateFileName();
    const filePath = path.join(this.options.outputDir!, fileName);
    XLSX.writeFile(workbook, filePath);

    const totalRows = allResults.reduce((sum, result) => sum + result.count, 0);
    console.log(`Excel 파일이 생성되었습니다: ${filePath} (총 ${totalRows}행)`);
    return filePath;
  }

  private groupResultsByQuery(results: DetectionResult[]): Map<string, DetectionResult[]> {
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
    const descriptions: Record<string, string> = {
      'invalidVisitType': '잘못된진료구분',
      'insuranceMismatch': '자격조회불일치',
      'doctorMismatch': '담당의불일치',
      'dateMismatch': '날짜불일치'
    };
    
    return descriptions[queryName] || queryName;
  }

  private addSummarySheet(workbook: XLSX.WorkBook, allResults: DetectionResult[]): void {
    const summary = new Map<string, Map<string, number>>();
    
    // 쿼리별, 병원별 집계
    for (const result of allResults) {
      if (!summary.has(result.queryName)) {
        summary.set(result.queryName, new Map());
      }
      
      const hospitalName = HospitalMap[result.dbName]?.hospitalName || '알 수 없는 병원';
      const queryMap = summary.get(result.queryName)!;
      queryMap.set(hospitalName, (queryMap.get(hospitalName) || 0) + result.count);
    }

    const summaryRows: Record<string, any>[] = [];
    
    for (const [queryName, hospitalMap] of summary) {
      const queryDescription = this.getQueryDescription(queryName);
      
      for (const [hospitalName, count] of hospitalMap) {
        if (count > 0) {
          summaryRows.push({
            '감지유형': queryDescription,
            '병원명': hospitalName,
            '건수': count
          });
        }
      }
    }

    if (summaryRows.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(summaryRows);
      const colWidths = this.calculateColumnWidths(summaryRows);
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, '요약');
    }
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