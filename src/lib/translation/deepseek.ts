/**
 * DeepSeek API 翻译封装
 * 支持 V-API 镜像和原 DeepSeek API
 * 支持批量翻译以提高效率
 */

import { fetchWithTimeout } from "@/lib/llm/fetch";
import { DEFAULT_SYSTEM_PROMPT, getTranslationConfig } from "./config";

// 从环境变量读取 API Base URL，默认使用 DeepSeek 官方 API
const LLM_API_BASE_URL =
  process.env.LLM_API_BASE_URL || "https://api.deepseek.com/v1";
const DEEPSEEK_API_URL = `${LLM_API_BASE_URL}/chat/completions`;
const SINGLE_REQUEST_TIMEOUT_MS = 60_000;
const BATCH_REQUEST_TIMEOUT_MS = 120_000;

interface TranslationResult {
  queryZh: string;
  responseZh: string;
}

interface BatchTranslationInput {
  id: number;
  query: string;
  response: string;
}

interface BatchTranslationResult {
  id: number;
  queryZh: string;
  responseZh: string;
}

/**
 * 检测文本是否需要翻译（中文占比低于50%才需要翻译）
 */
export function needsTranslation(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const ratio = chineseChars.length / text.length;
  return ratio < 0.5;
}

/**
 * 调用 DeepSeek API 进行翻译
 */
export async function translateToZh(
  query: string,
  response: string,
): Promise<TranslationResult> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY 未配置");
  }

  // 从配置文件读取 system prompt
  const config = await getTranslationConfig();
  const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const userPrompt = `用户提问：
${query}

AI回答：
${response}`;

  const res = await fetchWithTimeout(
    DEEPSEEK_API_URL,
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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    },
    SINGLE_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API 错误: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek API 返回空内容");
  }

  try {
    // 去除 markdown 代码块包裹 (V-API 可能返回 ```json...```)
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonContent) as {
      queryZh?: string;
      responseZh?: string;
    };
    return {
      queryZh: parsed.queryZh || "",
      responseZh: parsed.responseZh || "",
    };
  } catch {
    throw new Error(`JSON 解析失败: ${content.substring(0, 100)}`);
  }
}

const BATCH_SYSTEM_PROMPT = `你是专业翻译助手。请将以下多条对话记录翻译成中文。
每条记录格式为 [ID] 用户提问: ... AI回答: ...
请返回严格的JSON数组格式，保持ID对应：
[{"id": 1, "queryZh": "翻译后的提问", "responseZh": "翻译后的回答"}, ...]
注意：如果原文已是中文，直接保留原文。`;

/**
 * 批量翻译多条记录（单次 API 调用）
 * @param records 待翻译记录数组
 * @returns 翻译结果数组
 */
export async function translateBatch(
  records: BatchTranslationInput[],
): Promise<BatchTranslationResult[]> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY 未配置");
  }

  if (records.length === 0) {
    return [];
  }

  // 构建批量翻译 prompt
  const userPrompt = records
    .map(
      (r) =>
        `[${r.id}] 用户提问: ${r.query || "(空)"}\nAI回答: ${r.response || "(空)"}`,
    )
    .join("\n---\n");

  const res = await fetchWithTimeout(
    DEEPSEEK_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: BATCH_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    },
    BATCH_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API 错误: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek API 返回空内容");
  }

  try {
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonContent) as BatchTranslationResult[];
    return parsed;
  } catch {
    throw new Error(`批量翻译 JSON 解析失败: ${content.substring(0, 200)}`);
  }
}
