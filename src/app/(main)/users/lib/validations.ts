import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/lib/core/parsers";
import type { UserSummary } from "./queries";

export const usersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  sort: getSortingStateParser<UserSummary>().withDefault([
    { id: "lastSeenAt", desc: true },
  ]),
  // 搜索用户ID
  search: parseAsString.withDefault(""),
  // 时间范围筛选（使用 from/to 格式）
  from: parseAsString,
  to: parseAsString,
});

export type GetUsersSchema = Awaited<
  ReturnType<typeof usersSearchParamsCache.parse>
>;
