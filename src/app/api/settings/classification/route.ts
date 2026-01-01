/**
 * 分类配置 API
 * GET: 获取配置
 * PUT: 更新配置
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  type Category,
  getClassificationConfig,
  saveClassificationConfig,
} from "@/lib/classification/config";

/**
 * GET /api/settings/classification
 * 获取分类配置
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const config = await getClassificationConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("获取分类配置失败:", error);
    return NextResponse.json({ error: "获取分类配置失败" }, { status: 500 });
  }
}

/**
 * PUT /api/settings/classification
 * 更新分类配置
 */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }

    const body = (await request.json()) as {
      categories?: Category[];
      systemPrompt?: string;
    };

    // 验证类别列表
    if (!Array.isArray(body.categories)) {
      return NextResponse.json(
        { error: "categories 必须是数组" },
        { status: 400 },
      );
    }

    // 验证每个类别
    for (const cat of body.categories) {
      if (!cat.id || !cat.name) {
        return NextResponse.json(
          { error: "每个类别必须包含 id 和 name" },
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

    await saveClassificationConfig(body.categories, body.systemPrompt);

    const updatedConfig = await getClassificationConfig();
    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("更新分类配置失败:", error);
    return NextResponse.json({ error: "更新分类配置失败" }, { status: 500 });
  }
}
