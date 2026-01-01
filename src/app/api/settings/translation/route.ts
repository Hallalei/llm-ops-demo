/**
 * 翻译配置 API 路由
 * GET /api/settings/translation - 获取当前翻译 Prompt 配置
 * PUT /api/settings/translation - 更新翻译 Prompt 配置
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  getTranslationConfig,
  saveTranslationConfig,
} from "@/lib/translation/config";

/**
 * GET /api/settings/translation
 * 获取当前翻译 Prompt 配置
 *
 * 响应：
 *   { systemPrompt: string, updatedAt: string }
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const config = await getTranslationConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("读取翻译配置失败:", error);
    return NextResponse.json(
      {
        error: "读取配置失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/settings/translation
 * 更新翻译 Prompt 配置
 *
 * 请求体：
 *   { systemPrompt: string }
 *
 * 响应：
 *   { success: true, updatedAt: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const body = (await request.json()) as { systemPrompt?: string };

    // 验证请求体
    if (!body.systemPrompt || typeof body.systemPrompt !== "string") {
      return NextResponse.json(
        { error: "systemPrompt 字段必须为非空字符串" },
        { status: 400 },
      );
    }

    const systemPrompt = body.systemPrompt.trim();

    if (systemPrompt.length === 0) {
      return NextResponse.json(
        { error: "systemPrompt 不能为空" },
        { status: 400 },
      );
    }

    // 保存配置
    await saveTranslationConfig(systemPrompt);

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("保存翻译配置失败:", error);
    return NextResponse.json(
      {
        error: "保存配置失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
