import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Shell } from "@/components/shared/shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionDetailContent } from "./_components/session-detail-content";

// 为 Cache Components 模式提供占位参数
export async function generateStaticParams() {
  return [{ sessionId: "__placeholder__" }];
}

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage(props: SessionDetailPageProps) {
  const params = await props.params;
  const sessionId = decodeURIComponent(params.sessionId);

  return (
    <Shell className="max-w-5xl">
      {/* 头部导航 - 静态部分 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions">
            <ArrowLeft className="size-4" />
            <span className="sr-only">返回列表</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-xl tracking-tight">会话详情</h1>
          <p className="font-mono text-muted-foreground text-xs">{sessionId}</p>
        </div>
      </div>

      {/* 动态内容 - 包装在 Suspense 中 */}
      <Suspense fallback={<SessionDetailSkeleton />}>
        <SessionDetailContent sessionId={sessionId} />
      </Suspense>
    </Shell>
  );
}

function SessionDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* 信息卡片骨架 */}
      <div className="rounded-xl border bg-card p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 聊天视图骨架 */}
      <div className="h-[600px] rounded-xl border bg-card p-4">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <Skeleton className="h-20 w-3/4 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
