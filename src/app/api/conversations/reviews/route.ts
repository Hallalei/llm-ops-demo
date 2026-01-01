import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversationReviews } from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

/**
 * 获取当前用户的审核记录
 * GET /api/conversations/reviews?ids=1,2,3
 */
const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (request: Request, _ctx, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const idsParam = searchParams.get("ids");

      if (!idsParam) {
        return NextResponse.json(
          { error: "Missing ids parameter" },
          { status: 400 },
        );
      }

      const ids = idsParam
        .split(",")
        .map(Number)
        .filter((n) => !Number.isNaN(n));

      if (ids.length === 0) {
        return NextResponse.json({});
      }

      const reviews = await db
        .select({
          conversationId: conversationReviews.conversationId,
          status: conversationReviews.status,
          reviewedAt: conversationReviews.reviewedAt,
        })
        .from(conversationReviews)
        .where(
          and(
            eq(conversationReviews.userId, session.user.id),
            inArray(conversationReviews.conversationId, ids),
          ),
        );

      // 转换为 { conversationId: status } 的映射
      const reviewMap = reviews.reduce(
        (acc, review) => {
          acc[review.conversationId] = {
            status: review.status,
            reviewedAt: review.reviewedAt,
          };
          return acc;
        },
        {} as Record<number, { status: string; reviewedAt: Date }>,
      );

      return NextResponse.json(reviewMap);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }
  },
);

/**
 * 标记对话为已读
 * POST /api/conversations/reviews
 * Body: { conversationId: number, status?: "reviewed" | "flagged" | "skipped" }
 */
export const POST = withRoles(
  adminRoles,
  async (request: Request, _ctx, session) => {
    try {
      const body = (await request.json()) as {
        conversationId?: number;
        status?: string;
      };
      const { conversationId, status = "reviewed" } = body;

      if (!conversationId || typeof conversationId !== "number") {
        return NextResponse.json(
          { error: "Invalid conversationId" },
          { status: 400 },
        );
      }

      // 使用 upsert 逻辑
      const existing = await db
        .select()
        .from(conversationReviews)
        .where(
          and(
            eq(conversationReviews.userId, session.user.id),
            eq(conversationReviews.conversationId, conversationId),
          ),
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        // 更新
        await db
          .update(conversationReviews)
          .set({
            status: status as "reviewed" | "flagged" | "skipped",
            updatedAt: new Date(),
          })
          .where(eq(conversationReviews.id, existing[0].id));
      } else {
        // 插入
        await db.insert(conversationReviews).values({
          userId: session.user.id,
          conversationId,
          status: status as "reviewed" | "flagged" | "skipped",
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Failed to mark conversation as reviewed:", error);
      return NextResponse.json(
        { error: "Failed to mark conversation" },
        { status: 500 },
      );
    }
  },
);

/**
 * 删除审核记录（重置为未读）
 * DELETE /api/conversations/reviews?conversationId=123
 */
export const DELETE = withRoles(
  adminRoles,
  async (request: Request, _ctx, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const conversationId = Number(searchParams.get("conversationId"));

      if (Number.isNaN(conversationId)) {
        return NextResponse.json(
          { error: "Invalid conversationId" },
          { status: 400 },
        );
      }

      await db
        .delete(conversationReviews)
        .where(
          and(
            eq(conversationReviews.userId, session.user.id),
            eq(conversationReviews.conversationId, conversationId),
          ),
        );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Failed to delete review:", error);
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 },
      );
    }
  },
);
