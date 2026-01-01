import { eq } from "drizzle-orm";
import { db } from "@/db";
import { datasetItems, datasets, datasetVersions } from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

// GET /api/datasets/[datasetId] - Get dataset details (admin only)
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

    return Response.json(dataset);
  },
);

interface UpdateDatasetRequest {
  name?: string;
  description?: string;
}

// PATCH /api/datasets/[datasetId] - Update dataset (admin only)
export const PATCH = withRoles(
  adminRoles,
  async (
    req: Request,
    { params }: { params: Promise<{ datasetId: string }> },
  ) => {
    const { datasetId } = await params;
    const body = (await req.json()) as UpdateDatasetRequest;

    const [dataset] = await db
      .update(datasets)
      .set({
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, datasetId))
      .returning();

    if (!dataset) {
      return new Response("Not found", { status: 404 });
    }

    return Response.json(dataset);
  },
);

// DELETE /api/datasets/[datasetId] - Delete dataset (admin only)
export const DELETE = withRoles(
  adminRoles,
  async (
    _req: Request,
    { params }: { params: Promise<{ datasetId: string }> },
  ) => {
    const { datasetId } = await params;

    // Delete related items and versions first (cascade should handle this)
    await db.delete(datasetItems).where(eq(datasetItems.datasetId, datasetId));
    await db
      .delete(datasetVersions)
      .where(eq(datasetVersions.datasetId, datasetId));

    await db.delete(datasets).where(eq(datasets.id, datasetId));

    return new Response(null, { status: 204 });
  },
);
