import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";

export const DEFAULT_SYSTEM_PROMPT = `你是专业翻译助手。请将用户提问和AI回答分别翻译成中文。
返回严格的JSON格式，不要添加任何其他内容：
{"queryZh": "翻译后的提问", "responseZh": "翻译后的回答"}`;

export interface TranslationPromptConfig {
  systemPrompt: string;
  updatedAt: string;
}

const SETTING_KEY = "translation_config";

/**
 * 读取翻译 Prompt 配置
 * 从数据库读取，不存在则返回默认值
 */
export async function getTranslationConfig(): Promise<TranslationPromptConfig> {
  try {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, SETTING_KEY))
      .limit(1);

    const setting = result[0];
    if (setting) {
      const value = setting.value as { systemPrompt?: string };
      return {
        systemPrompt: value.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        updatedAt: setting.updatedAt.toISOString(),
      };
    }
  } catch (error) {
    console.error("读取翻译配置失败:", error);
  }

  return {
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 保存翻译 Prompt 配置
 * 使用 upsert 写入数据库
 * @param systemPrompt - 自定义的 system prompt
 */
export async function saveTranslationConfig(
  systemPrompt: string,
): Promise<void> {
  const now = new Date();
  await db
    .insert(systemSettings)
    .values({
      key: SETTING_KEY,
      value: { systemPrompt },
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: { systemPrompt },
        updatedAt: now,
      },
    });
}
