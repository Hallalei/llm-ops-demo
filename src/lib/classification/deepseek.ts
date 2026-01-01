/**
 * DeepSeek API 意图分类封装
 * 使用 Function Calling + enum 约束实现结构化输出
 * 支持 V-API 镜像和原 DeepSeek API
 * 支持批量分类以提高效率
 */

import { fetchWithTimeout } from "@/lib/llm/fetch";
import { type Category, getClassificationConfig } from "./config";

// 从环境变量读取 API Base URL，默认使用 DeepSeek 官方 API
const LLM_API_BASE_URL =
  process.env.LLM_API_BASE_URL || "https://api.deepseek.com/v1";
const DEEPSEEK_API_URL = `${LLM_API_BASE_URL}/chat/completions`;
const SINGLE_REQUEST_TIMEOUT_MS = 60_000;
const BATCH_REQUEST_TIMEOUT_MS = 120_000;

interface ClassificationResult {
  category: string;
  confidence: number;
}

interface DeepSeekResponse {
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
  category: string;
  confidence: number;
}

interface BatchClassificationInput {
  id: number;
  query: string;
}

interface BatchClassificationResult {
  id: number;
  category: string;
  confidence: number;
}

/**
 * 调用 DeepSeek API 进行意图分类
 * 使用 Function Calling 确保结构化输出
 */
export async function classifyIntent(
  query: string,
  categories: Category[],
): Promise<ClassificationResult> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY 未配置");
  }

  const config = await getClassificationConfig();
  const systemPrompt = config.systemPrompt;

  // 构建类别描述，帮助模型理解每个类别
  const categoryDescriptions = categories
    .map((c) => `- ${c.id}: ${c.name} - ${c.description}`)
    .join("\n");

  const fullSystemPrompt = `${systemPrompt}

可选类别:
${categoryDescriptions}

请根据用户问题选择最匹配的类别。`;

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
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.1,
        tools: [
          {
            type: "function",
            function: {
              name: "classify_intent",
              description: "对用户问题进行意图分类",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: categories.map((c) => c.id),
                    description: "意图类别ID",
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    description: "置信度 0-1",
                  },
                },
                required: ["category", "confidence"],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "classify_intent" },
        },
      }),
    },
    SINGLE_REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API 错误: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as DeepSeekResponse;
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall?.function?.arguments) {
    throw new Error("DeepSeek API 未返回有效的 function call");
  }

  try {
    const result = JSON.parse(
      toolCall.function.arguments,
    ) as FunctionCallResult;
    return {
      category: result.category,
      confidence: result.confidence,
    };
  } catch {
    throw new Error(`解析分类结果失败: ${toolCall.function.arguments}`);
  }
}

/**
 * 批量分类多条记录（单次 API 调用）
 * 使用 JSON 输出而非 Function Calling，以支持批量返回
 * @param records 待分类记录数组
 * @param categories 类别配置
 * @returns 分类结果数组
 */
export async function classifyBatch(
  records: BatchClassificationInput[],
  categories: Category[],
): Promise<BatchClassificationResult[]> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY 未配置");
  }

  if (records.length === 0) {
    return [];
  }

  const config = await getClassificationConfig();
  const categoryDescriptions = categories
    .map((c) => `- ${c.id}: ${c.name} - ${c.description}`)
    .join("\n");

  const batchSystemPrompt = `${config.systemPrompt}

可选类别:
${categoryDescriptions}

你将收到多条用户问题，每条格式为 [ID] 问题内容。
请对每条问题进行意图分类，返回严格的 JSON 数组格式：
[{"id": 1, "category": "类别ID", "confidence": 0.95}, ...]
注意：category 必须是上述可选类别之一，confidence 是 0-1 之间的数字。`;

  const userPrompt = records.map((r) => `[${r.id}] ${r.query}`).join("\n");

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
    throw new Error(`DeepSeek API 错误: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as DeepSeekResponse;
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

    const parsed = JSON.parse(jsonContent) as BatchClassificationResult[];
    return parsed;
  } catch {
    throw new Error(`批量分类 JSON 解析失败: ${content.substring(0, 200)}`);
  }
}
