import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { datasetItems, datasets } from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

// GET /api/datasets/[datasetId]/items/[itemId] - Get single item (admin only)
export const GET = withRoles(
  adminRoles,
  async (
    _req: Request,
    { params }: { params: Promise<{ datasetId: string; itemId: string }> },
  ) => {
    const { datasetId, itemId } = await params;

    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return new Response("Dataset not found", { status: 404 });
    }

    const [item] = await db
      .select()
      .from(datasetItems)
      .where(
        and(eq(datasetItems.id, itemId), eq(datasetItems.datasetId, datasetId)),
      )
      .limit(1);

    if (!item) {
      return new Response("Item not found", { status: 404 });
    }

    return Response.json(item);
  },
);

interface UpdateItemRequest {
  note?: string;
}

// PATCH /api/datasets/[datasetId]/items/[itemId] - Update item note (admin only)
export const PATCH = withRoles(
  adminRoles,
  async (
    req: Request,
    { params }: { params: Promise<{ datasetId: string; itemId: string }> },
  ) => {
    const { datasetId, itemId } = await params;
    const body = (await req.json()) as UpdateItemRequest;

    // Verify dataset exists
    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return new Response("Dataset not found", { status: 404 });
    }

    const [item] = await db
      .update(datasetItems)
      .set({
        note: body.note?.trim() || null,
      })
      .where(
        and(eq(datasetItems.id, itemId), eq(datasetItems.datasetId, datasetId)),
      )
      .returning();

    if (!item) {
      return new Response("Item not found", { status: 404 });
    }

    return Response.json(item);
  },
);

// DELETE /api/datasets/[datasetId]/items/[itemId] - Remove item from dataset (admin only)
export const DELETE = withRoles(
  adminRoles,
  async (
    _req: Request,
    { params }: { params: Promise<{ datasetId: string; itemId: string }> },
  ) => {
    const { datasetId, itemId } = await params;

    // Verify dataset exists
    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return new Response("Dataset not found", { status: 404 });
    }

    // Delete item
    const result = await db
      .delete(datasetItems)
      .where(
        and(eq(datasetItems.id, itemId), eq(datasetItems.datasetId, datasetId)),
      )
      .returning();

    if (result.length > 0) {
      // Update item count
      await db
        .update(datasets)
        .set({
          itemCount: sql`GREATEST(${datasets.itemCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(datasets.id, datasetId));
    }

    return new Response(null, { status: 204 });
  },
);
