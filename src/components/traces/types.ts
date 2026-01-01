export interface TraceData {
  id: number;
  createdTime: string | null;
  sessionId: string | null;
  traceId: string | null;
  tags: string | null;
  env: string | null;
  latency: string | null;
  userId: string | null;
  query: string | null;
  response: string | null;
  metadata: Record<string, unknown> | string | null;
  scores: Record<string, unknown> | string | null;
  precision: string | null;
  relevance: string | null;
  languageMatch: string | null;
  fidelity: string | null;
  queryZh: string | null;
  responseZh: string | null;
  category: string | null;
  confidence: number | string | null;
  detectedLanguage: string | null;
  languageConfidence: number | string | null;
}
