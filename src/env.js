import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    // Demo mode settings
    DEMO_MODE: z.string().optional(),
    DATABASE_SCHEMA: z.string().optional(),
    // Auth.js
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().url().optional(),
    // Internal API secrets
    TRANSLATE_SECRET: z.string().min(1).optional(),
    // Admin
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(6).optional(),
    // Background tasks
    ENABLE_AUTO_TRANSLATE: z.string().optional(),
    TRANSLATE_CRON_SCHEDULE: z.string().optional(),
    TRANSLATE_BATCH_SIZE: z.string().optional(),
    TRANSLATE_CONCURRENCY: z.string().optional(),
    ENABLE_AUTO_CLASSIFY: z.string().optional(),
    CLASSIFY_CRON_SCHEDULE: z.string().optional(),
    CLASSIFY_BATCH_SIZE: z.string().optional(),
    CLASSIFY_CONCURRENCY: z.string().optional(),
    ENABLE_AUTO_LANGUAGE_DETECT: z.string().optional(),
    LANGUAGE_DETECT_CRON_SCHEDULE: z.string().optional(),
    LANGUAGE_DETECT_BATCH_SIZE: z.string().optional(),
    LANGUAGE_DETECT_CONCURRENCY: z.string().optional(),
    // LLM base URL (V-API / DeepSeek)
    LLM_API_BASE_URL: z.string().url().optional(),
    // Public API
    PUBLIC_API_KEY: z.string().min(1).optional(),
    // V-API (Playground)
    VAPI_API_KEY: z.string().min(1).optional(),
    VAPI_BASE_URL: z.string().url().optional(),
    OPENROUTER_KEY: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DEMO_MODE: process.env.DEMO_MODE,
    DATABASE_SCHEMA: process.env.DATABASE_SCHEMA,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    TRANSLATE_SECRET: process.env.TRANSLATE_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ENABLE_AUTO_TRANSLATE: process.env.ENABLE_AUTO_TRANSLATE,
    TRANSLATE_CRON_SCHEDULE: process.env.TRANSLATE_CRON_SCHEDULE,
    TRANSLATE_BATCH_SIZE: process.env.TRANSLATE_BATCH_SIZE,
    TRANSLATE_CONCURRENCY: process.env.TRANSLATE_CONCURRENCY,
    ENABLE_AUTO_CLASSIFY: process.env.ENABLE_AUTO_CLASSIFY,
    CLASSIFY_CRON_SCHEDULE: process.env.CLASSIFY_CRON_SCHEDULE,
    CLASSIFY_BATCH_SIZE: process.env.CLASSIFY_BATCH_SIZE,
    CLASSIFY_CONCURRENCY: process.env.CLASSIFY_CONCURRENCY,
    ENABLE_AUTO_LANGUAGE_DETECT: process.env.ENABLE_AUTO_LANGUAGE_DETECT,
    LANGUAGE_DETECT_CRON_SCHEDULE: process.env.LANGUAGE_DETECT_CRON_SCHEDULE,
    LANGUAGE_DETECT_BATCH_SIZE: process.env.LANGUAGE_DETECT_BATCH_SIZE,
    LANGUAGE_DETECT_CONCURRENCY: process.env.LANGUAGE_DETECT_CONCURRENCY,
    LLM_API_BASE_URL: process.env.LLM_API_BASE_URL,
    PUBLIC_API_KEY: process.env.PUBLIC_API_KEY,
    VAPI_API_KEY: process.env.VAPI_API_KEY,
    VAPI_BASE_URL: process.env.VAPI_BASE_URL,
    OPENROUTER_KEY: process.env.OPENROUTER_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
