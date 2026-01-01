import { Calendar, MessageSquare, User } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SessionChatView } from "../../_components/session-chat-view";
import { getSessionConversations, getSessionInfo } from "../../lib/queries";

interface SessionDetailContentProps {
  sessionId: string;
}

/**
 * 会话详情内容组件（服务端异步组件）
 * 分离出来用于 Suspense 包装
 */
export async function SessionDetailContent({
  sessionId,
}: SessionDetailContentProps) {
  const [sessionInfo, conversations] = await Promise.all([
    getSessionInfo(sessionId),
    getSessionConversations(sessionId),
  ]);

  if (!sessionInfo) {
    notFound();
  }

  return (
    <>
      {/* 环境标签 */}
      <div className="-mt-8 mb-2 flex justify-end">
        <Badge variant={sessionInfo.env === "prod" ? "default" : "secondary"}>
          {sessionInfo.env === "prod" ? "生产" : "开发"}
        </Badge>
      </div>

      {/* 会话信息卡片 */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">用户 ID</p>
              <p className="font-mono text-sm">{sessionInfo.userId || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">消息数量</p>
              <p className="font-medium">{sessionInfo.messageCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">开始时间</p>
              <p className="text-sm">{sessionInfo.firstMessageTime || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">最后活跃</p>
              <p className="text-sm">{sessionInfo.lastMessageTime || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 聊天视图 */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-[600px] p-0">
          <SessionChatView
            conversations={conversations}
            sessionId={sessionId}
          />
        </CardContent>
      </Card>
    </>
  );
}
