"use client";

import {
  Database,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageCircle,
  MessageSquare,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import type { UserRole } from "@/db/schema";
import { logout } from "@/lib/auth/actions";
import { ModeToggle } from "./mode-toggle";

interface AppSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
  };
}

const allNavItems = [
  {
    title: "仪表盘",
    url: "/dashboard",
    icon: LayoutDashboard,
    minRole: "user" as const,
  },
  {
    title: "对话",
    url: "/traces",
    icon: MessageCircle,
    minRole: "admin" as const,
  },
  {
    title: "会话",
    url: "/sessions",
    icon: MessageSquare,
    minRole: "admin" as const,
  },
  { title: "用户", url: "/users", icon: Users, minRole: "admin" as const },
  {
    title: "数据集",
    url: "/datasets",
    icon: Database,
    minRole: "admin" as const,
  },
  {
    title: "设置",
    url: "/settings",
    icon: Settings,
    minRole: "superadmin" as const,
  },
];

function canAccessNavItem(
  userRole: UserRole | undefined,
  minRole: UserRole,
): boolean {
  if (!userRole) return false;
  if (userRole === "superadmin") return true;
  if (userRole === "admin") return minRole !== "superadmin";
  return minRole === "user";
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  const navItems = allNavItems.filter((item) =>
    canAccessNavItem(user?.role, item.minRole),
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">{siteConfig.name}</span>
            <span className="text-muted-foreground text-xs">AI 对话管理</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      pathname.startsWith(`${item.url}/`)
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="size-8">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>
                    {user.name?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-sm">
                      {user.name || "用户"}
                    </p>
                    {isSuperAdmin ? (
                      <Badge variant="default" className="h-4 px-1 text-[10px]">
                        <ShieldCheck className="mr-0.5 size-2.5" />
                        超管
                      </Badge>
                    ) : isAdmin ? (
                      <Badge variant="default" className="h-4 px-1 text-[10px]">
                        <Shield className="mr-0.5 size-2.5" />
                        管理员
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[10px]"
                      >
                        普通用户
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </p>
                </div>
                <form action={logout}>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="submit"
                    className="size-8"
                    title="退出登录"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </form>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm group-data-[collapsible=icon]:hidden">
                主题
              </span>
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
