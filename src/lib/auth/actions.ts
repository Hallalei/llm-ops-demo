"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, signOut } from "./index";

// 注册表单验证 schema
const registerSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
});

// 登录表单验证 schema
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
});

export type AuthState = {
  success: boolean;
  message: string;
};

/**
 * 用户注册
 */
export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "表单验证失败",
    };
  }

  const { name, email, password } = parsed.data;

  try {
    // 检查邮箱是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return {
        success: false,
        message: "该邮箱已被注册",
      };
    }

    // 密码加密
    const hashedPassword = await hash(password, 12);

    // 创建用户
    await db.insert(users).values({
      id: nanoid(),
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    return {
      success: true,
      message: "注册成功，请登录",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "注册失败，请稍后重试",
    };
  }
}

/**
 * 用户登录
 */
export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "表单验证失败",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    return {
      success: true,
      message: "登录成功",
    };
  } catch (error) {
    // AuthError 会在重定向时抛出
    if ((error as Error).message?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    return {
      success: false,
      message: "邮箱或密码错误",
    };
  }
}

/**
 * 用户登出
 */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}
