import type { Config } from "drizzle-kit";
import { env } from "@/env.js";

import { databaseSchema } from "@/lib/constants";

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schemaFilter: [databaseSchema],
} satisfies Config;
