import { NextResponse } from "next/server";
import { getUsers } from "@/app/(main)/users/lib/queries";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(adminRoles, async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("perPage")) || 20;
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from") || null;
    const to = searchParams.get("to") || null;

    const result = await getUsers({
      page,
      perPage,
      search,
      from,
      to,
      sort: [{ id: "lastSeenAt", desc: true }],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
