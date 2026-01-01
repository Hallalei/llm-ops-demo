import { NextResponse } from "next/server";

const API_VERSION = "1.0.0";

// 指标元信息定义
const metricsSchema = {
  stats: {
    name: "核心统计",
    description: "对话总数、今日新增/小时峰值/日均、独立用户数、独立会话数（含环比对比）",
  },
  dailyTrend: {
    name: "每日趋势",
    description: "按天统计的对话数量趋势，区分生产/开发环境",
  },
  tagStats: {
    name: "标签维度统计",
    description: "平台分布(App/Web)、用户反馈(赞/踩)、页面入口、LLM异常统计",
  },
  categoryCounts: {
    name: "意图分类分布",
    description: "用户问题的意图分类统计（产品咨询、技术支持、订单服务等）",
  },
  // ===== 新增指标在这里添加 =====
};

function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  const apiKey = process.env.PUBLIC_API_KEY;
  return !!apiKey && authHeader === `Bearer ${apiKey}`;
}

export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      version: API_VERSION,
      updatedAt: "2025-12-23T00:00:00Z",
      metrics: metricsSchema,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
