import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "./permissions";

/**
 * 服务端权限检查 - 仅超级管理员可访问
 * 在需要超级管理员权限的页面中使用（如设置页面）
 */
export async function requireSuperAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return session;
}

/**
 * 服务端权限检查 - 仅管理员可访问
 * 在需要管理员权限的页面中使用
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return session;
}

/**
 * 服务端权限检查 - 需要登录
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}
