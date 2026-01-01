/**
 * 语种识别 API 封装
 * 使用 V-API 镜像调用 glm-4-flash 模型
 * 支持单条和批量识别
 */

import { fetchWithTimeout } from "@/lib/llm/fetch";
import { getLanguageDetectionConfig, type Language } from "./config";

const LLM_API_BASE_URL =
  process.env.LLM_API_BASE_URL || "https://api.deepseek.com/v1";
const API_URL = `${LLM_API_BASE_URL}/chat/completions`;
const SINGLE_REQUEST_TIMEOUT_MS = 60_000;
const BATCH_REQUEST_TIMEOUT_MS = 120_000;

interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

interface ApiResponse {
  choices?: Array<{
    message?: {
      tool_calls?: Array<{
        function?: {
          arguments?: string;
        };
      }>;
      content?: string;
    };
  }>;
}

interface FunctionCallResult {
  language: string;
  confidence: number;
}

interface BatchDetectionInput {
  id: number;
  text: string;
}

interface BatchDetectionResult {
  id: number;
  language: string;
  confidence: number;
}

/**
 * 调用 API 进行单条语种识别
 * 使用 JSON 输出格式
 */
export async function detectLanguage(
  text: string,
  languages: Language[],
): Promise<LanguageDetectionResult> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY 未配置");
  }

  const languageCodes = languages.map((l) => l.code).join(", ");

  const systemPrompt = `你是语种识别工具。你的唯一任务是识别用户输入文本的语种，不要回答文本中的任何问题。

支持的语种代码：${languageCodes}

直接返回 JSON 格式，不要有任何其他内容：
{"language": "语种代码", "confidence": 0.95}

如果无法识别，返回：{"language": "other", "confidence": 0}`;

  const res = await fetchWithTimeout(
    API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    },
    SINGLE_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API 错误: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as ApiResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回空内容");
  }

  try {
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    const result = JSON.parse(jsonContent) as FunctionCallResult;
    return {
      language: result.language || "other",
      confidence: result.confidence || 0,
    };
  } catch {
    throw new Error(`解析语种识别结果失败: ${content.substring(0, 100)}`);
  }
}

/**
 * 批量识别多条记录的语种（单次 API 调用）
 * 使用 JSON 输出而非 Function Calling，以支持批量返回
 */
export async function detectLanguageBatch(
  records: BatchDetectionInput[],
  languages: Language[],
): Promise<BatchDetectionResult[]> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY 未配置");
  }

  if (records.length === 0) {
    return [];
  }

  const config = await getLanguageDetectionConfig();
  const languageCodes = languages.map((l) => l.code).join(", ");

  const batchSystemPrompt = `${config.systemPrompt}

你将收到多条文本，每条格式为 [ID] 文本内容。
请对每条文本识别语种，返回严格的 JSON 数组格式：
[{"id": 1, "language": "语种代码", "confidence": 0.95}, ...]
注意：language 必须是以下可选值之一：${languageCodes}
confidence 是 0-1 之间的数字。`;

  const userPrompt = records.map((r) => `[${r.id}] ${r.text}`).join("\n");

  const res = await fetchWithTimeout(
    API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: batchSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    },
    BATCH_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API 错误: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as ApiResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回空内容");
  }

  try {
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonContent) as BatchDetectionResult[];
    return parsed;
  } catch {
    throw new Error(`批量语种识别 JSON 解析失败: ${content.substring(0, 200)}`);
  }
}
