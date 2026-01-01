import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, conversationTranslations } from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * 获取指定 Session 的所有对话
 * GET /api/sessions/:sessionId/conversations
 */
const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (_request: Request, { params }: RouteParams) => {
    try {
      const { sessionId } = await params;
      const decodedSessionId = decodeURIComponent(sessionId);

      const data = await db
        .select({
          id: conversations.id,
          createdTime: conversations.createdTime,
          traceId: conversations.traceId,
          query: conversations.query,
          response: conversations.response,
          queryZh: conversationTranslations.queryZh,
          responseZh: conversationTranslations.responseZh,
          latency: conversations.latency,
          metadata: conversations.metadata,
          scores: conversations.scores,
          tag: conversations.tag,
          precision: conversations.precision,
          relevance: conversations.relevance,
          languageMatch: conversations.languageMatch,
          fidelity: conversations.fidelity,
        })
        .from(conversations)
        .leftJoin(
          conversationTranslations,
          sql`${conversations.id} = ${conversationTranslations.conversationId}`,
        )
        .where(eq(conversations.sessionId, decodedSessionId))
        .orderBy(asc(conversations.createdTime));

      return NextResponse.json(data);
    } catch (error) {
      console.error("Failed to fetch session conversations:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 },
      );
    }
  },
);
