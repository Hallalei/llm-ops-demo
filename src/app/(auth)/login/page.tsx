"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, login } from "@/lib/auth/actions";

const REMEMBER_EMAIL_KEY = "deye_llm_ops_remembered_email";

const initialState: AuthState = {
  success: false,
  message: "",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (email) {
      setSavedEmail(email);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (formData: FormData) => {
    const email = formData.get("email") as string;
    if (rememberMe && email) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
    formAction(formData);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">欢迎回来</CardTitle>
          <CardDescription>登录到 Deye LLM Ops 管理系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    defaultValue={savedEmail}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="cursor-pointer font-normal text-sm"
                  >
                    记住邮箱
                  </Label>
                </div>
                {state.message && !state.success && (
                  <p className="text-destructive text-sm">{state.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "登录中..." : "登录"}
                </Button>
              </div>
              <div className="text-center text-sm">
                还没有账号?{" "}
                <Link href="/register" className="underline underline-offset-4">
                  立即注册
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
