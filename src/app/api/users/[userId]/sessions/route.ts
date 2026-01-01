import { NextResponse } from "next/server";
import { getUserSessions } from "@/app/(main)/users/lib/queries";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (
    request: Request,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = await params;
      const decodedUserId = decodeURIComponent(userId);

      const { searchParams } = new URL(request.url);
      const limit = Number(searchParams.get("limit")) || 20;

      const sessions = await getUserSessions(decodedUserId, limit);

      return NextResponse.json(sessions);
    } catch (error) {
      console.error("GET /api/users/[userId]/sessions error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
