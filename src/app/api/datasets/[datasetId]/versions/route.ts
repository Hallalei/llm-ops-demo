import { and, asc, desc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { datasetItems, datasets, datasetVersions } from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

// GET /api/datasets/[datasetId]/versions - Get all versions (admin only)
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

    const versions = await db
      .select({
        id: datasetVersions.id,
        version: datasetVersions.version,
        name: datasetVersions.name,
        description: datasetVersions.description,
        itemCount: datasetVersions.itemCount,
        createdAt: datasetVersions.createdAt,
      })
      .from(datasetVersions)
      .where(eq(datasetVersions.datasetId, datasetId))
      .orderBy(desc(datasetVersions.version));

    return Response.json(versions);
  },
);

interface CreateVersionRequest {
  name?: string;
  description?: string;
}

// POST /api/datasets/[datasetId]/versions - Create version snapshot (admin only)
export const POST = withRoles(
  adminRoles,
  async (
    req: Request,
    { params }: { params: Promise<{ datasetId: string }> },
  ) => {
    const { datasetId } = await params;
    const body = (await req.json()) as CreateVersionRequest;

    // Verify dataset exists
    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    if (!dataset) {
      return new Response("Dataset not found", { status: 404 });
    }

    // Get current items
    const items = await db
      .select()
      .from(datasetItems)
      .where(eq(datasetItems.datasetId, datasetId))
      .orderBy(asc(datasetItems.createdAt));

    if (items.length === 0) {
      return new Response("Cannot create version for empty dataset", {
        status: 400,
      });
    }

    // Get next version number
    const [maxVersion] = await db
      .select({ maxVersion: max(datasetVersions.version) })
      .from(datasetVersions)
      .where(eq(datasetVersions.datasetId, datasetId));

    const nextVersion = (maxVersion?.maxVersion ?? 0) + 1;

    // Create snapshot
    const snapshot = items.map((item) => item.content);

    const [version] = await db
      .insert(datasetVersions)
      .values({
        datasetId,
        version: nextVersion,
        name: body.name?.trim() || `v${nextVersion}`,
        description: body.description?.trim() || null,
        itemCount: items.length,
        snapshot,
      })
      .returning();

    return Response.json(version);
  },
);
