/**
 * 批处理器类型定义
 */

export interface BatchStats {
  success: number;
  failed: number;
  remaining: number;
}

export interface ProgressStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

export interface ProcessResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

export interface BatchProcessorConfig {
  concurrencyEnvKey: string;
  defaultConcurrency: number;
}
