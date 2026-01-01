import type { UserRole } from "@/db/schema";

// 定义需要超级管理员权限的路径
const superadminOnlyPaths = ["/settings"];

// 定义需要管理员权限的路径（普通用户不可访问）
const adminOnlyPaths = ["/traces", "/sessions", "/users", "/datasets"];

// 用户可访问的路径（普通用户仅限仪表盘）
const userAllowedPaths = ["/dashboard"];

/**
 * 检查路径是否需要超级管理员权限
 */
export function isSuperAdminOnlyPath(pathname: string): boolean {
  return superadminOnlyPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * 检查路径是否需要管理员权限
 */
export function isAdminOnlyPath(pathname: string): boolean {
  return adminOnlyPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * 检查用户是否有权限访问指定路径
 */
export function canAccessPath(pathname: string, role: UserRole): boolean {
  // 超级管理员可访问所有路径
  if (role === "superadmin") {
    return true;
  }

  // 管理员可访问除超级管理员专属路径外的所有路径
  if (role === "admin") {
    return !isSuperAdminOnlyPath(pathname);
  }

  // 普通用户可以查看允许的路径（只读）
  return userAllowedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * 检查用户是否有编辑权限
 * 普通用户对所有数据只有查看权限，无编辑权限
 */
export function canEdit(role: UserRole): boolean {
  return role === "superadmin" || role === "admin";
}

/**
 * 检查用户是否是超级管理员
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "superadmin";
}

/**
 * 检查用户是否是管理员（包括超级管理员）
 */
export function isAdmin(role: UserRole): boolean {
  return role === "superadmin" || role === "admin";
}
