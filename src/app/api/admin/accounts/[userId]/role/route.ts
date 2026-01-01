import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/permissions";

const updateRoleSchema = z.object({
  role: z.enum(["superadmin", "admin", "user"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    // 只有超级管理员可以修改角色
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ message: "无权限访问" }, { status: 403 });
    }

    const { userId } = await params;

    // 不能修改自己的权限
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: "不能修改自己的权限" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "无效的角色类型" }, { status: 400 });
    }

    const { role } = parsed.data;

    // 检查用户是否存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    // 不允许修改超级管理员的角色
    if (existingUser.role === "superadmin") {
      return NextResponse.json(
        { message: "不能修改超级管理员的权限" },
        { status: 400 },
      );
    }

    // 更新用户角色
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ message: "更新权限失败" }, { status: 500 });
  }
}
