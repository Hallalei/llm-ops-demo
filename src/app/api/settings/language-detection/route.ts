/**
 * 语种识别配置 API
 * GET: 获取配置
 * PUT: 更新配置
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  getLanguageDetectionConfig,
  type Language,
  saveLanguageDetectionConfig,
} from "@/lib/language-detection/config";

/**
 * GET /api/settings/language-detection
 * 获取语种识别配置
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const config = await getLanguageDetectionConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("获取语种识别配置失败:", error);
    return NextResponse.json(
      { error: "获取语种识别配置失败" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/settings/language-detection
 * 更新语种识别配置
 */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const body = (await request.json()) as {
      languages?: Language[];
      systemPrompt?: string;
    };

    // 验证语种列表
    if (!Array.isArray(body.languages)) {
      return NextResponse.json(
        { error: "languages 必须是数组" },
        { status: 400 },
      );
    }

    // 验证每个语种
    for (const lang of body.languages) {
      if (!lang.code || !lang.name) {
        return NextResponse.json(
          { error: "每个语种必须包含 code 和 name" },
          { status: 400 },
        );
      }
    }

    // 验证 systemPrompt
    if (!body.systemPrompt || typeof body.systemPrompt !== "string") {
      return NextResponse.json(
        { error: "systemPrompt 必须是非空字符串" },
        { status: 400 },
      );
    }

    await saveLanguageDetectionConfig(body.languages, body.systemPrompt);

    const updatedConfig = await getLanguageDetectionConfig();
    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("更新语种识别配置失败:", error);
    return NextResponse.json(
      { error: "更新语种识别配置失败" },
      { status: 500 },
    );
  }
}
