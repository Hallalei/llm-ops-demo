import { NextResponse } from "next/server";
import { getUserConversations } from "@/app/(main)/users/lib/queries";
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

      const conversations = await getUserConversations(decodedUserId, limit);

      return NextResponse.json(conversations);
    } catch (error) {
      console.error("GET /api/users/[userId]/conversations error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
