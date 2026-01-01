import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  conversations,
  conversationTranslations,
  type DatasetItemContent,
  datasetItems,
  datasets,
} from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

// GET /api/datasets/[datasetId]/items - Get all items in dataset (admin only)
export const GET = withRoles(
  adminRoles,
  async (
    _req: Request,
    { params }: { params: Promise<{ datasetId: string }> },
  ) => {
    const { datasetId } = await params;

    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return new Response("Not found", { status: 404 });
    }

    const items = await db
      .select()
      .from(datasetItems)
      .where(eq(datasetItems.datasetId, datasetId))
      .orderBy(asc(datasetItems.createdAt));

    return Response.json(items);
  },
);

interface AddItemRequest {
  source: "trace" | "session";
  conversationId: number;
  sessionId?: string;
  note?: string;
}

// POST /api/datasets/[datasetId]/items - Add item to dataset (admin only)
export const POST = withRoles(
  adminRoles,
  async (
    req: Request,
    { params }: { params: Promise<{ datasetId: string }> },
  ) => {
    const { datasetId } = await params;
    const body = (await req.json()) as AddItemRequest;

    // Verify dataset exists
    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return new Response("Dataset not found", { status: 404 });
    }

    // Build content based on source
    const content = await buildDatasetItemContent(
      body.source,
      body.conversationId,
      body.sessionId,
    );

    if (!content) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Insert item
    const [item] = await db
      .insert(datasetItems)
      .values({
        datasetId,
        source: body.source,
        conversationId: body.conversationId,
        content,
        note: body.note?.trim() || null,
      })
      .returning();

    // Update item count
    await db
      .update(datasets)
      .set({
        itemCount: sql`${datasets.itemCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, datasetId));

    return Response.json(item);
  },
);

/**
 * Build dataset item content based on source type
 * - trace: Direct reference (input/output only)
 * - session: Include context from previous messages
 */
async function buildDatasetItemContent(
  source: "trace" | "session",
  conversationId: number,
  sessionId?: string,
): Promise<DatasetItemContent | null> {
  // Get the target conversation
  const [conv] = await db
    .select({
      id: conversations.id,
      sessionId: conversations.sessionId,
      query: conversations.query,
      response: conversations.response,
      createdTime: conversations.createdTime,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv || !conv.query || !conv.response) {
    return null;
  }

  // Trace mode: simple input only
  if (source === "trace") {
    return {
      input: conv.query,
      conversationId,
    };
  }

  // Session mode: build context from previous messages
  const effectiveSessionId = sessionId || conv.sessionId;
  if (!effectiveSessionId) {
    // No session, treat as trace
    return {
      input: conv.query,
      conversationId,
    };
  }

  // Get all conversations in the session, ordered by time
  const sessionConvs = await db
    .select({
      id: conversations.id,
      query: conversations.query,
      response: conversations.response,
      createdTime: conversations.createdTime,
    })
    .from(conversations)
    .where(eq(conversations.sessionId, effectiveSessionId))
    .orderBy(asc(conversations.createdTime));

  // Find target conversation position
  const targetIndex = sessionConvs.findIndex((c) => c.id === conversationId);
  if (targetIndex === -1) {
    return {
      input: conv.query,
      conversationId,
    };
  }

  // Build context from previous conversations
  const context: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (let i = 0; i < targetIndex; i++) {
    const prevConv = sessionConvs[i];
    if (prevConv?.query) {
      context.push({ role: "user", content: prevConv.query });
    }
    if (prevConv?.response) {
      context.push({ role: "assistant", content: prevConv.response });
    }
  }

  return {
    context: context.length > 0 ? context : undefined,
    input: conv.query,
    conversationId,
    sessionId: effectiveSessionId,
    positionInSession: targetIndex,
  };
}
