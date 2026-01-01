import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { envOptions } from "@/db/schema";
import { getSortingStateParser } from "@/lib/core/parsers";
import type { SessionSummary } from "./queries";

export const sessionsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  sort: getSortingStateParser<SessionSummary>().withDefault([
    { id: "lastMessageTime", desc: true },
  ]),
  // 筛选条件
  sessionId: parseAsString.withDefault(""),
  userId: parseAsString.withDefault(""),
  env: parseAsStringEnum([...envOptions, ""]).withDefault(""),
  // 时间范围筛选（使用 from/to 格式）
  from: parseAsString,
  to: parseAsString,
});

export type GetSessionsSchema = Awaited<
  ReturnType<typeof sessionsSearchParamsCache.parse>
>;
