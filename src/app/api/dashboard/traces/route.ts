import { and, count, desc, eq, gte, ilike, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  conversationClassifications,
  conversationLanguageDetections,
  conversations,
  conversationTranslations,
} from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(adminRoles, async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get("filterType");
    const filterValue = searchParams.get("filterValue");
    const days = Number(searchParams.get("days")) || 7;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || 20),
    );
    const offset = (page - 1) * pageSize;

    if (!filterType || !filterValue) {
      return NextResponse.json(
        { error: "Missing filterType or filterValue" },
        { status: 400 },
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateFilter = gte(conversations.createdTime, startDate.toISOString());

    let whereCondition: SQL | undefined;

    switch (filterType) {
      case "platform":
        if (filterValue === "Other") {
          whereCondition = and(
            dateFilter,
            sql`${conversations.tags} NOT LIKE '%App%' AND ${conversations.tags} NOT LIKE '%Web%'`,
          );
        } else {
          whereCondition = and(
            dateFilter,
            ilike(conversations.tags, `%${filterValue}%`),
          );
        }
        break;

      case "feedback":
        if (filterValue === "like") {
          whereCondition = and(dateFilter, ilike(conversations.tags, `%赞%`));
        } else if (filterValue === "dislike") {
          whereCondition = and(dateFilter, ilike(conversations.tags, `%踩%`));
        }
        break;

      case "noKnowledge":
        whereCondition = and(
          dateFilter,
          ilike(conversations.tags, `%NO_KNOWLEDGE%`),
        );
        break;

      case "emptyReply":
        whereCondition = and(dateFilter, ilike(conversations.tags, `%None%`));
        break;

      case "category": {
        const categoryWhere = and(
          dateFilter,
          eq(conversationClassifications.category, filterValue),
        );

        const [categoryCountResult, categoryResult] = await Promise.all([
          db
            .select({ total: count() })
            .from(conversations)
            .innerJoin(
              conversationClassifications,
              sql`${conversations.id} = ${conversationClassifications.conversationId}`,
            )
            .where(categoryWhere),
          db
            .select({
              id: conversations.id,
              createdTime: conversations.createdTime,
              sessionId: conversations.sessionId,
              tags: conversations.tags,
              env: conversations.env,
              userId: conversations.userId,
              query: conversations.query,
              queryZh: conversationTranslations.queryZh,
              category: conversationClassifications.category,
            })
            .from(conversations)
            .leftJoin(
              conversationTranslations,
              sql`${conversations.id} = ${conversationTranslations.conversationId}`,
            )
            .innerJoin(
              conversationClassifications,
              sql`${conversations.id} = ${conversationClassifications.conversationId}`,
            )
            .where(categoryWhere)
            .orderBy(desc(conversations.id))
            .limit(pageSize)
            .offset(offset),
        ]);

        const total = categoryCountResult[0]?.total ?? 0;
        return NextResponse.json({
          data: categoryResult,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      }

      case "pageEntry":
        whereCondition = and(
          dateFilter,
          ilike(conversations.tags, `%${filterValue}%`),
        );
        break;

      case "language": {
        const languageWhere = and(
          dateFilter,
          eq(conversationLanguageDetections.language, filterValue),
          sql`${conversationLanguageDetections.status} = 'completed'`,
        );

        const [languageCountResult, languageResult] = await Promise.all([
          db
            .select({ total: count() })
            .from(conversations)
            .innerJoin(
              conversationLanguageDetections,
              sql`${conversations.id} = ${conversationLanguageDetections.conversationId}`,
            )
            .where(languageWhere),
          db
            .select({
              id: conversations.id,
              createdTime: conversations.createdTime,
              sessionId: conversations.sessionId,
              tags: conversations.tags,
              env: conversations.env,
              userId: conversations.userId,
              query: conversations.query,
              queryZh: conversationTranslations.queryZh,
              category: conversationClassifications.category,
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
            .innerJoin(
              conversationLanguageDetections,
              sql`${conversations.id} = ${conversationLanguageDetections.conversationId}`,
            )
            .where(languageWhere)
            .orderBy(desc(conversations.id))
            .limit(pageSize)
            .offset(offset),
        ]);

        const total = languageCountResult[0]?.total ?? 0;
        return NextResponse.json({
          data: languageResult,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      }

      case "today":
        whereCondition = sql`DATE(${conversations.createdTime}) = CURRENT_DATE`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid filterType" },
          { status: 400 },
        );
    }

    // Count total records
    const countResult = await db
      .select({ total: count() })
      .from(conversations)
      .leftJoin(
        conversationClassifications,
        sql`${conversations.id} = ${conversationClassifications.conversationId}`,
      )
      .where(whereCondition);

    const total = countResult[0]?.total ?? 0;

    const result = await db
      .select({
        id: conversations.id,
        createdTime: conversations.createdTime,
        sessionId: conversations.sessionId,
        tags: conversations.tags,
        env: conversations.env,
        userId: conversations.userId,
        query: conversations.query,
        queryZh: conversationTranslations.queryZh,
        category: conversationClassifications.category,
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
      .where(whereCondition)
      .orderBy(desc(conversations.id))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Dashboard traces API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
