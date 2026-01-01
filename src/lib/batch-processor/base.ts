/**
 * 批处理基类
 * 提供高并发批量处理的通用逻辑
 */

import type {
  BatchProcessorConfig,
  BatchStats,
  ProcessResult,
  ProgressStats,
} from "./types";

export abstract class BatchProcessor<TRecord> {
  protected config: BatchProcessorConfig;

  constructor(config: BatchProcessorConfig) {
    this.config = config;
  }

  /**
   * 获取待处理记录
   */
  abstract getPendingRecords(limit: number): Promise<TRecord[]>;

  /**
   * 处理单条记录
   */
  abstract processOne(record: TRecord): Promise<ProcessResult>;

  /**
   * 获取剩余待处理数量
   */
  abstract getRemainingCount(): Promise<number>;

  /**
   * 获取进度统计
   */
  abstract getProgress(): Promise<ProgressStats>;

  /**
   * 获取并发数
   */
  protected getConcurrency(): number {
    return (
      Number(process.env[this.config.concurrencyEnvKey]) ||
      this.config.defaultConcurrency
    );
  }

  /**
   * 批量处理记录（使用高并发模式）
   * V-API 支持高并发（最高 2000），使用 Promise.all 并发处理
   */
  async batchProcess(limit: number): Promise<BatchStats> {
    const pendingRecords = await this.getPendingRecords(limit);

    const stats: BatchStats = {
      success: 0,
      failed: 0,
      remaining: 0,
    };

    if (pendingRecords.length === 0) {
      stats.remaining = await this.getRemainingCount();
      return stats;
    }

    const concurrency = this.getConcurrency();

    // 分批并发处理
    for (let i = 0; i < pendingRecords.length; i += concurrency) {
      const batch = pendingRecords.slice(i, i + concurrency);

      const results = await Promise.all(
        batch.map((record) => this.processOne(record)),
      );

      for (const result of results) {
        if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
        }
      }
    }

    stats.remaining = await this.getRemainingCount();
    return stats;
  }
}
