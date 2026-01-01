"use client";

import {
  ChevronDown,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AccountRole = "superadmin" | "admin" | "user";

interface Account {
  id: string;
  name: string | null;
  email: string;
  role: AccountRole;
  createdAt: string;
}

const roleLabels: Record<AccountRole, string> = {
  superadmin: "超级管理员",
  admin: "管理员",
  user: "普通用户",
};

export function AccountsSettings() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    newRole: AccountRole;
    userName: string;
  } | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = (await res.json()) as Account[];
      setAccounts(data);
    } catch {
      toast.error("获取账号列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleRoleChange = async (userId: string, newRole: AccountRole) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/accounts/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { message?: string };
        throw new Error(error.message || "Failed to update role");
      }

      toast.success(`已将用户角色更改为${roleLabels[newRole]}`);
      fetchAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新权限失败");
    } finally {
      setUpdating(null);
      setConfirmDialog(null);
    }
  };

  const openConfirmDialog = (
    userId: string,
    newRole: AccountRole,
    userName: string,
  ) => {
    setConfirmDialog({ open: true, userId, newRole, userName });
  };

  const getRoleBadge = (role: AccountRole) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-amber-600 hover:bg-amber-600"
          >
            <ShieldCheck className="size-3" />
            超级管理员
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="default" className="gap-1">
            <Shield className="size-3" />
            管理员
          </Badge>
        );
      default:
        return <Badge variant="secondary">普通用户</Badge>;
    }
  };

  const getAvailableRoles = (currentRole: AccountRole): AccountRole[] => {
    const allRoles: AccountRole[] = ["superadmin", "admin", "user"];
    return allRoles.filter((r) => r !== currentRole);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            注册用户
          </CardTitle>
          <CardDescription>
            普通用户可查看所有数据（只读），管理员可编辑，超级管理员可访问设置
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              暂无注册用户
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarFallback>
                            {(
                              account.name?.[0] ||
                              account.email?.[0] ||
                              "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {account.name || "未设置"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.email}
                    </TableCell>
                    <TableCell>{getRoleBadge(account.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(account.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updating === account.id}
                          >
                            {updating === account.id ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : null}
                            更改角色
                            <ChevronDown className="ml-1 size-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {getAvailableRoles(account.role).map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() =>
                                openConfirmDialog(
                                  account.id,
                                  role,
                                  account.name || account.email,
                                )
                              }
                            >
                              {role === "superadmin" && (
                                <ShieldCheck className="mr-2 size-4" />
                              )}
                              {role === "admin" && (
                                <Shield className="mr-2 size-4" />
                              )}
                              {role === "user" && (
                                <ShieldOff className="mr-2 size-4" />
                              )}
                              设为{roleLabels[role]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open: boolean) => !open && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更改用户角色</DialogTitle>
            <DialogDescription>
              确定要将 &quot;{confirmDialog?.userName}&quot; 的角色更改为
              {confirmDialog?.newRole && roleLabels[confirmDialog.newRole]}吗？
              {confirmDialog?.newRole === "superadmin" && (
                <span className="mt-2 block text-amber-600">
                  警告：超级管理员拥有系统全部权限，包括修改其他用户权限。
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              取消
            </Button>
            <Button
              onClick={() =>
                confirmDialog &&
                handleRoleChange(confirmDialog.userId, confirmDialog.newRole)
              }
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
