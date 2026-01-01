import { NextResponse } from "next/server";
import { getUserStats } from "@/app/(main)/users/lib/queries";
import { withRoles } from "@/lib/auth/api-guards";

const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (
    _request: Request,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = await params;
      const decodedUserId = decodeURIComponent(userId);
      const userStats = await getUserStats(decodedUserId);

      if (!userStats) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(userStats);
    } catch (error) {
      console.error("GET /api/users/[userId] error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
