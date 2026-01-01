import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { datasets } from "@/db/schema";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

// GET /api/datasets - Get all datasets (admin only)
export const GET = withRoles(adminRoles, async () => {
  const data = await db
    .select()
    .from(datasets)
    .orderBy(desc(datasets.updatedAt));

  return Response.json(data);
});

interface CreateDatasetRequest {
  name: string;
  description?: string;
}

// POST /api/datasets - Create new dataset (admin only)
export const POST = withRoles(
  adminRoles,
  async (req: Request, _ctx, session) => {
    const body = (await req.json()) as CreateDatasetRequest;

    if (!body.name?.trim()) {
      return new Response("Name is required", { status: 400 });
    }

    const [dataset] = await db
      .insert(datasets)
      .values({
        userId: session.user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
      })
      .returning();

    return Response.json(dataset);
  },
);
