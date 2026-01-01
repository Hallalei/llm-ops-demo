"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, register } from "@/lib/auth/actions";

const initialState: AuthState = {
  success: false,
  message: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(register, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.push("/login");
    }
  }, [state, router]);

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">创建账号</CardTitle>
          <CardDescription>注册 Deye LLM Ops 管理系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="输入您的姓名"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="至少6个字符"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {state.message && !state.success && (
                  <p className="text-destructive text-sm">{state.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "注册中..." : "注册"}
                </Button>
              </div>
              <div className="text-center text-sm">
                已有账号?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  立即登录
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="text-balance text-center text-muted-foreground text-xs">
        注册后默认为普通用户，需要管理员授权后才能使用完整功能
      </p>
    </div>
  );
}
