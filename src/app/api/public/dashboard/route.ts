import { NextResponse } from "next/server";

import {
  getDailyTrend,
  getDashboardStatsWithComparison,
  getTagDimensionStats,
  type DateRangeParams,
} from "@/app/(main)/dashboard/lib/queries";
import { getCategoryCounts } from "@/app/(main)/traces/_lib/queries";

const API_VERSION = "1.1.0";

// 临时函数：将 from/to 转换为 days，返回 0 表示"全部"
function getDaysFromDateRange(from?: string | null, to?: string | null): number {
  if (!from || !to) return 0;
  const fromDate = new Date(from);
  let toDate = new Date(to);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (toDate > today) {
    toDate = today;
  }
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 7;
}

// 白名单：允许外部调用的查询函数
const allowedQueries: Record<
  string,
  (params: DateRangeParams) => Promise<unknown>
> = {
  stats: getDashboardStatsWithComparison,
  dailyTrend: getDailyTrend,
  tagStats: getTagDimensionStats,
  // categoryCounts 仍使用 days 参数，需要包装
  categoryCounts: async ({ from, to }: DateRangeParams) => {
    const days = getDaysFromDateRange(from, to);
    return getCategoryCounts(days);
  },
  // ===== 新增指标只需在这里加一行 =====
};

function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  const apiKey = process.env.PUBLIC_API_KEY;
  return !!apiKey && authHeader === `Bearer ${apiKey}`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // 支持新的 from/to 参数，同时保持 days 参数的向后兼容
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const daysParam = searchParams.get("days");

  let dateParams: DateRangeParams;
  if (from && to) {
    dateParams = { from, to };
  } else if (daysParam) {
    // 向后兼容：将 days 转换为 from/to
    const days = Number(daysParam) || 7;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    dateParams = {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    };
  } else {
    dateParams = {};
  }

  const metricsParam = searchParams.get("metrics");
  const requestedMetrics = metricsParam
    ? metricsParam.split(",")
    : Object.keys(allowedQueries);

  const validMetrics = requestedMetrics.filter((m) => m in allowedQueries);

  const results = await Promise.all(
    validMetrics.map(async (key) => {
      const fetcher = allowedQueries[key];
      return [key, fetcher ? await fetcher(dateParams) : null];
    }),
  );

  return NextResponse.json(
    {
      _meta: {
        from: dateParams.from,
        to: dateParams.to,
        timestamp: Date.now(),
        version: API_VERSION,
        available: Object.keys(allowedQueries),
      },
      data: Object.fromEntries(results),
    },
    { headers: corsHeaders },
  );
}

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { days?: number; from?: string; to?: string; metrics?: string[] } =
    {};
  try {
    body = (await request.json()) as {
      days?: number;
      from?: string;
      to?: string;
      metrics?: string[];
    };
  } catch {
    // 空 body 或解析失败，使用默认值
  }

  // 支持新的 from/to 参数，同时保持 days 参数的向后兼容
  let dateParams: DateRangeParams;
  if (body.from && body.to) {
    dateParams = { from: body.from, to: body.to };
  } else if (body.days) {
    const days = body.days;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    dateParams = {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    };
  } else {
    dateParams = {};
  }

  const requestedMetrics = body.metrics ?? Object.keys(allowedQueries);
  const validMetrics = requestedMetrics.filter((m) => m in allowedQueries);

  const results = await Promise.all(
    validMetrics.map(async (key) => {
      const fetcher = allowedQueries[key];
      return [key, fetcher ? await fetcher(dateParams) : null];
    }),
  );

  return NextResponse.json(
    {
      _meta: {
        from: dateParams.from,
        to: dateParams.to,
        timestamp: Date.now(),
        version: API_VERSION,
        available: Object.keys(allowedQueries),
      },
      data: Object.fromEntries(results),
    },
    { headers: corsHeaders },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
