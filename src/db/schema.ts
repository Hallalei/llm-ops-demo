import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import {
  conversationsTableName,
  databaseSchema,
  isDemoMode,
} from "@/lib/constants";

// 定义数据库 schema
// 当 schema 是 "public" 或者开启 Demo 模式时，使用 pgTable（默认 public schema）
// 否则使用自定义 pgSchema
const usePublicSchema = isDemoMode || databaseSchema === "public";
const remoteSchema = usePublicSchema ? null : pgSchema(databaseSchema);

// 辅助函数：根据模式创建表
const createTable = usePublicSchema
  ? pgTable
  : (name: string, columns: any, extra?: any) =>
      remoteSchema!.table(name, columns, extra);

// ============================================
// Auth.js 用户认证相关表
// ============================================

// 用户角色枚举
export const userRoles = ["superadmin", "admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];

// 用户表
export const users = createTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: text("role").$type<UserRole>().default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// OAuth 账户表 (Google, Apple 等)
export const accounts = createTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

// 会话表 (用于数据库会话策略)
export const sessions = createTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// 验证令牌表 (用于邮箱验证)
export const verificationTokens = createTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;

// 对话记录表 - Demo 模式使用 "conversations"，生产环境映射 "灵思 实时数据"
export const conversations = createTable(conversationsTableName, {
  id: integer("id").primaryKey(),
  createdTime: text("created_time"),
  sessionId: text("session_id"),
  traceId: text("trace_id"),
  tags: text("tags"),
  env: text("env"),
  latency: text("latency"),
  userId: text("user_id"),
  query: text("query"),
  response: text("response"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  scores: json("scores").$type<Record<string, unknown>>(),
  tag: text("tag"),
  precision: text("精准度"),
  relevance: text("相关性"),
  languageMatch: text("语言匹配率"),
  fidelity: text("忠诚度"),
});

// 翻译表 - 存储对话的中文翻译
export const conversationTranslations = createTable(
  "conversation_translations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    conversationId: integer("conversation_id").notNull().unique(),
    queryZh: text("query_zh"),
    responseZh: text("response_zh"),
    status: text("status").notNull().default("pending"), // pending, completed, failed
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

// 分类表 - 存储对话的意图分类结果
export const conversationClassifications = createTable(
  "conversation_classifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    conversationId: integer("conversation_id").notNull().unique(),
    category: text("category"),
    confidence: text("confidence"),
    status: text("status").notNull().default("pending"), // pending, completed, failed
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

// 语种识别表 - 存储对话的语种识别结果
export const conversationLanguageDetections = createTable(
  "conversation_language_detections",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    conversationId: integer("conversation_id").notNull().unique(),
    language: text("language"),
    confidence: text("confidence"),
    status: text("status").notNull().default("pending"), // pending, completed, failed
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

// 类型导出
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationTranslation =
  typeof conversationTranslations.$inferSelect;
export type NewConversationTranslation =
  typeof conversationTranslations.$inferInsert;
export type ConversationClassification =
  typeof conversationClassifications.$inferSelect;
export type NewConversationClassification =
  typeof conversationClassifications.$inferInsert;
export type ConversationLanguageDetection =
  typeof conversationLanguageDetections.$inferSelect;
export type NewConversationLanguageDetection =
  typeof conversationLanguageDetections.$inferInsert;

// 枚举值定义 (用于筛选器)
export const envOptions = ["prod", "dev"] as const;
export type EnvOption = (typeof envOptions)[number];

// ============================================
// Dataset Tables
// ============================================

// Dataset item content type
export interface DatasetItemContent {
  context?: Array<{ role: "user" | "assistant"; content: string }>;
  input: string;
  conversationId: number;
  sessionId?: string;
  positionInSession?: number;
}

// Datasets table
export const datasets = createTable("datasets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  itemCount: integer("item_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dataset items table
export const datasetItems = createTable("dataset_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  source: text("source").$type<"trace" | "session">().notNull(),
  conversationId: integer("conversation_id").notNull(),
  content: json("content").$type<DatasetItemContent>().notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dataset versions table
export const datasetVersions = createTable("dataset_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  name: text("name"),
  description: text("description"),
  itemCount: integer("item_count").notNull(),
  snapshot: json("snapshot").$type<DatasetItemContent[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dataset Types
export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;
export type DatasetItem = typeof datasetItems.$inferSelect;
export type NewDatasetItem = typeof datasetItems.$inferInsert;
export type DatasetVersion = typeof datasetVersions.$inferSelect;
export type NewDatasetVersion = typeof datasetVersions.$inferInsert;

// Dataset Relations
export const datasetsRelations = relations(datasets, ({ many }) => ({
  items: many(datasetItems),
  versions: many(datasetVersions),
}));

export const datasetItemsRelations = relations(datasetItems, ({ one }) => ({
  dataset: one(datasets, {
    fields: [datasetItems.datasetId],
    references: [datasets.id],
  }),
}));

export const datasetVersionsRelations = relations(
  datasetVersions,
  ({ one }) => ({
    dataset: one(datasets, {
      fields: [datasetVersions.datasetId],
      references: [datasets.id],
    }),
  }),
);

// ============================================
// System Settings Table
// ============================================

// 系统配置表 - 存储翻译/分类等配置
export const systemSettings = createTable("system_settings", {
  key: text("key").primaryKey(),
  value: json("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System Settings Types
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

// ============================================
// End Users Table (终端用户表)
// ============================================

// 终端用户表 - 存储 AI 对话系统中的终端用户数据
// 注意：区别于 Auth.js 的 users 表（管理员账号），此表存储业务用户
export const endUsers = createTable("end_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // 外部用户ID - 对应 conversations.userId，作为唯一标识
  externalId: text("external_id").notNull().unique(),
  // 用户基本信息
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  // 元数据 - 存储额外的用户属性
  metadata: json("metadata").$type<Record<string, unknown>>(),
  // 统计字段（可通过定时任务或触发器更新）
  totalConversations: integer("total_conversations").default(0),
  totalSessions: integer("total_sessions").default(0),
  // 活跃信息
  firstSeenAt: timestamp("first_seen_at"),
  lastSeenAt: timestamp("last_seen_at"),
  // 时间戳
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// End Users Types
export type EndUser = typeof endUsers.$inferSelect;
export type NewEndUser = typeof endUsers.$inferInsert;

// ============================================
// Conversation Reviews Table (对话审核记录表)
// ============================================

// 审核状态枚举
export const reviewStatuses = ["reviewed", "flagged", "skipped"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

// 对话审核记录表 - 存储管理员查看/审核对话的记录
export const conversationReviews = createTable("conversation_reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // 管理员用户ID（关联 users 表）
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 对话ID
  conversationId: integer("conversation_id").notNull(),
  // 审核状态
  status: text("status").$type<ReviewStatus>().notNull().default("reviewed"),
  // 备注
  note: text("note"),
  // 时间戳
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversation Reviews Types
export type ConversationReview = typeof conversationReviews.$inferSelect;
export type NewConversationReview = typeof conversationReviews.$inferInsert;
