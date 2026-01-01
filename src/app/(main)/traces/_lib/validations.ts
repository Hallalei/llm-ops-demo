import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { type Conversation, envOptions, reviewStatuses } from "@/db/schema";
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@/lib/core/parsers";

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  sort: getSortingStateParser<Conversation>().withDefault([
    { id: "id", desc: true },
  ]),
  // 基础筛选
  query: parseAsString.withDefault(""),
  env: parseAsArrayOf(parseAsStringEnum([...envOptions])).withDefault([]),
  tags: parseAsString.withDefault(""),
  userId: parseAsString.withDefault(""),
  sessionId: parseAsString.withDefault(""),
  // 意图分类筛选
  category: parseAsArrayOf(parseAsString).withDefault([]),
  // 高级筛选
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  filterFlag: parseAsStringEnum(["advancedFilters", "commandFilters"] as const),
  // 周期筛选
  dateRange: parseAsStringEnum([
    "24h",
    "7d",
    "30d",
    "90d",
    "all",
    "custom",
  ]).withDefault("all"),
  from: parseAsString,
  to: parseAsString,
  // 审核状态筛选
  reviewStatus: parseAsStringEnum([
    "all",
    "unreviewed",
    ...reviewStatuses,
  ]).withDefault("all"),
  // 质量筛选
  qualityFilter: parseAsStringEnum([
    "all",
    "low_fidelity",
    "low_relevance",
    "low_precision",
    "low_any",
    "thumbs_down",
  ]).withDefault("all"),
});

export type GetConversationsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
