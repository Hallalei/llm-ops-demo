/**
 * 意图分类配置管理
 * 使用数据库持久化存储
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";

// 默认分类类别
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "product_inquiry",
    name: "产品咨询",
    description: "关于产品功能、规格的询问",
  },
  {
    id: "technical_support",
    name: "技术支持",
    description: "技术问题、故障排查",
  },
  {
    id: "order_service",
    name: "订单服务",
    description: "订单查询、物流、退换货",
  },
  { id: "complaint", name: "投诉建议", description: "投诉、反馈、建议" },
  { id: "other", name: "其他", description: "无法归类的问题" },
];

export const DEFAULT_SYSTEM_PROMPT = `你是意图分类助手。根据用户提问，判断其意图类别。
请仔细分析用户的问题内容，选择最匹配的类别。`;

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface ClassificationConfig {
  categories: Category[];
  systemPrompt: string;
  updatedAt: string;
}

const SETTING_KEY = "classification_config";

/**
 * 读取分类配置
 * 从数据库读取，不存在则返回默认值
 */
export async function getClassificationConfig(): Promise<ClassificationConfig> {
  try {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, SETTING_KEY))
      .limit(1);

    const setting = result[0];
    if (setting) {
      const value = setting.value as {
        categories?: Category[];
        systemPrompt?: string;
      };
      return {
        categories: value.categories || DEFAULT_CATEGORIES,
        systemPrompt: value.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        updatedAt: setting.updatedAt.toISOString(),
      };
    }
  } catch (error) {
    console.error("读取分类配置失败:", error);
  }

  return {
    categories: DEFAULT_CATEGORIES,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 保存分类配置
 * 使用 upsert 写入数据库
 */
export async function saveClassificationConfig(
  categories: Category[],
  systemPrompt: string,
): Promise<void> {
  const now = new Date();
  await db
    .insert(systemSettings)
    .values({
      key: SETTING_KEY,
      value: { categories, systemPrompt },
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: { categories, systemPrompt },
        updatedAt: now,
      },
    });
}

/**
 * 获取分类类别列表（用于筛选器选项）
 */
export async function getCategoryOptions(): Promise<Category[]> {
  const config = await getClassificationConfig();
  return config.categories;
}
