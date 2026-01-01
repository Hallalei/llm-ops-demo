import { createSearchParamsCache, parseAsString } from "nuqs/server";
import { z } from "zod";

export const dashboardSearchParamsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type DashboardSearchParams = z.infer<typeof dashboardSearchParamsSchema>;

export const dashboardSearchParamsCache = createSearchParamsCache({
  from: parseAsString,
  to: parseAsString,
});
