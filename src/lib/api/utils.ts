/**
 * API 认证中间件
 * 验证 Bearer Token
 */

import { type NextRequest, NextResponse } from "next/server";

type Handler = (request: NextRequest) => Promise<NextResponse>;

/**
 * 包装需要认证的 API 处理器
 */
export function withAuth(handler: Handler): Handler {
  return async (request: NextRequest) => {
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.TRANSLATE_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "服务器未配置认证密钥" },
        { status: 500 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "认证失败" }, { status: 401 });
    }

    return handler(request);
  };
}

/**
 * 解析请求体中的 limit/batchSize 参数
 */
export async function parseBatchParams(
  request: NextRequest,
  defaults: { limit?: number; max?: number } = {},
): Promise<number> {
  const { limit = 10, max = 100 } = defaults;

  try {
    const body = (await request.json()) as {
      limit?: number;
      batchSize?: number;
    };
    const requestedLimit = body.limit ?? body.batchSize;
    if (typeof requestedLimit === "number") {
      return Math.min(Math.max(requestedLimit, 1), max);
    }
  } catch {
    // 忽略 JSON 解析错误
  }

  return limit;
}

/**
 * 标准化 API 错误响应
 */
export function apiError(
  message: string,
  status: number,
  details?: string,
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status },
  );
}

/**
 * 标准化 API 成功响应
 */
export function apiSuccess<T>(data: T): NextResponse {
  return NextResponse.json(data);
}
