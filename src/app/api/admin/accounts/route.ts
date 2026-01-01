import { eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/permissions";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    // 只有超级管理员可以查看账号列表
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ message: "无权限访问" }, { status: 403 });
    }

    // 显示所有账号（除了当前登录用户自己）
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(ne(users.id, session.user.id))
      .orderBy(users.createdAt);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ message: "获取账号列表失败" }, { status: 500 });
  }
}
