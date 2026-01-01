import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "@/db/schema";
import { auth } from "@/lib/auth";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext,
  session: Session,
) => Response | Promise<Response>;

export function withSession<TContext = unknown>(
  handler: RouteHandler<TContext>,
) {
  return async (request: Request, context: TContext) => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(request, context, session);
  };
}

export function withRoles<TContext = unknown>(
  allowedRoles: readonly UserRole[],
  handler: RouteHandler<TContext>,
) {
  return withSession<TContext>(async (request, context, session) => {
    const role = session.user?.role as UserRole | undefined;
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(request, context, session);
  });
}
