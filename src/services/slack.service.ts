import { WebClient } from '@slack/web-api';
import * as fs from 'fs';
import * as path from 'path';
import {
  DetectionResult,
  HospitalMap,
  QUERY_TYPE,
  QUERY_TYPE_INFO,
} from '../types/types.js';

export interface SlackConfig {
  token: string;
  channel: string;
  enabled: boolean;
  startDate: string;
}

export class SlackService {
  private client?: WebClient;
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
    if (config.enabled && config.token) {
      this.client = new WebClient(config.token);
    }
  }

  private formatDetectionSummary(results: DetectionResult[]): string {
    const summary = new Map<string, Map<string, number>>();
    let totalCount = 0;

    // 쿼리별, 병원별 집계
    for (const result of results) {
      if (result.count > 0) {
        if (!summary.has(result.queryName)) {
          summary.set(result.queryName, new Map());
        }

        const hospitalName =
          HospitalMap[result.dbName]?.hospitalName ||
          `알 수 없는 병원 (${result.dbName})`;
        const queryMap = summary.get(result.queryName)!;
        queryMap.set(
          hospitalName,
          (queryMap.get(result.queryName) || 0) + result.count
        );
        totalCount += result.count;
      }
    }

    if (totalCount === 0) {
      return '🎉 *메디씨 데이터 불일치 감지 결과*\n\n✅ 감지된 이상 항목이 없습니다.';
    }

    let message = `🚨 *메디씨 데이터 불일치 감지 결과*\n\n`;
    message += `📊 *${this.config.startDate}날짜 이후로 총 ${totalCount}건의 이상 항목이 감지되었습니다.*\n\n`;

    for (const [queryName, hospitalMap] of summary) {
      const description =
        QUERY_TYPE_INFO[queryName as keyof typeof QUERY_TYPE_INFO]
          ?.excelSheetName || queryName;
      message += `*[${description}] - 총 ${[...hospitalMap.values()].reduce((a, b) => a + b, 0)}건*\n`;

      for (const [hospitalName, count] of hospitalMap) {
        if (count > 0) {
          message += `  • ${hospitalName}: ${count}건\n`;
        }
      }
      message += '\n';
    }

    const now = new Date().toLocaleString('ko-KR');
    message += `🕒 감지 시간: ${now}`;

    return message;
  }

  async sendDetectionResults(
    results: DetectionResult[],
    excelFilePath?: string
  ): Promise<void> {
    if (!this.config.enabled || !this.client) {
      console.log('Slack 알림이 비활성화되어 있습니다.');
      return;
    }

    try {
      const message = this.formatDetectionSummary(results);

      // 텍스트 메시지 전송
      const response = await this.client.chat.postMessage({
        channel: this.config.channel,
        text: message,
        unfurl_links: false,
        unfurl_media: false,
      });

      console.log('Slack 메시지가 전송되었습니다.');

      // Excel 파일이 있다면 업로드
      if (excelFilePath && fs.existsSync(excelFilePath)) {
        await this.uploadFile(excelFilePath, response.ts);
      }
    } catch (error) {
      console.error('Slack 알림 전송 실패:', (error as Error).message);
    }
  }

  private async uploadFile(filePath: string, threadTs?: string): Promise<void> {
    if (!this.client) return;

    try {
      const fileName = path.basename(filePath);
      const fileStats = fs.statSync(filePath);

      if (fileStats.size > 50 * 1024 * 1024) {
        // 50MB 제한
        console.warn(
          `파일 크기가 너무 큽니다 (${Math.round(fileStats.size / 1024 / 1024)}MB). Slack 업로드를 건너뜁니다.`
        );
        return;
      }

      const uploadParams: any = {
        channel_id: this.config.channel,
        file: fs.createReadStream(filePath),
        filename: fileName,
        title: `스케줄 감지 결과 - ${fileName}`,
        initial_comment: '📋 상세한 감지 결과가 포함된 Excel 파일입니다.',
      };

      if (threadTs) {
        uploadParams.thread_ts = threadTs;
      }

      await this.client.files.uploadV2(uploadParams);

      console.log(`Excel 파일이 Slack에 업로드되었습니다: ${fileName}`);
    } catch (error) {
      console.error('Slack 파일 업로드 실패:', (error as Error).message);
    }
  }

  async sendCustomMessage(message: string): Promise<void> {
    if (!this.config.enabled || !this.client) {
      console.log('Slack 알림이 비활성화되어 있습니다.');
      return;
    }

    try {
      await this.client.chat.postMessage({
        channel: this.config.channel,
        text: message,
        unfurl_links: false,
        unfurl_media: false,
      });

      console.log('Slack 커스텀 메시지가 전송되었습니다.');
    } catch (error) {
      console.error('Slack 메시지 전송 실패:', (error as Error).message);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.auth.test();
      console.log(`Slack 연결 테스트 성공: ${result.user}@${result.team}`);
      return true;
    } catch (error) {
      console.error('Slack 연결 테스트 실패:', (error as Error).message);
      return false;
    }
  }

  async sendErrorMessage(error: Error): Promise<void> {
    const message =
      `❌ * 메디씨 데이터 불일치 감지 오류*\n\n` +
      `🚫 오류 메시지: \`${error.message}\`\n` +
      `⏰ ${new Date().toLocaleString('ko-KR')}`;

    await this.sendCustomMessage(message);
  }
}
