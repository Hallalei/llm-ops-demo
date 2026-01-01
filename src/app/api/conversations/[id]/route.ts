import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  conversationClassifications,
  conversations,
  conversationTranslations,
} from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取单条对话详情
 * GET /api/conversations/:id
 */
const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (_request: Request, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const conversationId = Number(id);

      if (Number.isNaN(conversationId)) {
        return NextResponse.json(
          { error: "Invalid conversation ID" },
          { status: 400 },
        );
      }

      const data = await db
        .select({
          id: conversations.id,
          createdTime: conversations.createdTime,
          sessionId: conversations.sessionId,
          traceId: conversations.traceId,
          tags: conversations.tags,
          env: conversations.env,
          latency: conversations.latency,
          userId: conversations.userId,
          query: conversations.query,
          response: conversations.response,
          metadata: conversations.metadata,
          scores: conversations.scores,
          precision: conversations.precision,
          relevance: conversations.relevance,
          languageMatch: conversations.languageMatch,
          fidelity: conversations.fidelity,
          queryZh: conversationTranslations.queryZh,
          responseZh: conversationTranslations.responseZh,
          category: conversationClassifications.category,
          confidence: conversationClassifications.confidence,
        })
        .from(conversations)
        .leftJoin(
          conversationTranslations,
          sql`${conversations.id} = ${conversationTranslations.conversationId}`,
        )
        .leftJoin(
          conversationClassifications,
          sql`${conversations.id} = ${conversationClassifications.conversationId}`,
        )
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!data[0]) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(data[0]);
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversation" },
        { status: 500 },
      );
    }
  },
);
