import { NextResponse } from "next/server";
import { getAdjacentSessions } from "@/app/(main)/sessions/lib/queries";
import { withRoles } from "@/lib/auth/api-guards";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * 获取相邻会话 ID
 * GET /api/sessions/:sessionId/adjacent
 */
const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (_request: Request, { params }: RouteParams) => {
    try {
      const { sessionId } = await params;
      const decodedSessionId = decodeURIComponent(sessionId);

      const result = await getAdjacentSessions(decodedSessionId);

      return NextResponse.json(result);
    } catch (error) {
      console.error("Failed to fetch adjacent sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch adjacent sessions" },
        { status: 500 },
      );
    }
  },
);
