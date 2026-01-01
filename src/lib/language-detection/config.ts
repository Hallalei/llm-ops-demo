/**
 * 语种识别配置管理
 * 使用数据库持久化存储
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";

// 支持的语种列表（24种 + 其他）
export const DEFAULT_LANGUAGES: Language[] = [
  { code: "ar", name: "阿拉伯语", nameEn: "Arabic" },
  { code: "bg", name: "保加利亚语", nameEn: "Bulgarian" },
  { code: "de", name: "德语", nameEn: "German" },
  { code: "en", name: "英语", nameEn: "English" },
  { code: "es", name: "西班牙语", nameEn: "Spanish" },
  { code: "fr", name: "法语", nameEn: "French" },
  { code: "hi", name: "印地语", nameEn: "Hindi" },
  { code: "hu", name: "匈牙利语", nameEn: "Hungarian" },
  { code: "id", name: "印尼语", nameEn: "Indonesian" },
  { code: "it", name: "意大利语", nameEn: "Italian" },
  { code: "ja", name: "日本语", nameEn: "Japanese" },
  { code: "nl", name: "荷兰语", nameEn: "Dutch" },
  { code: "tl", name: "菲律宾语", nameEn: "Filipino" },
  { code: "pl", name: "波兰语", nameEn: "Polish" },
  { code: "pt", name: "葡萄牙语", nameEn: "Portuguese" },
  { code: "ro", name: "罗马尼亚语", nameEn: "Romanian" },
  { code: "ru", name: "俄语", nameEn: "Russian" },
  { code: "th", name: "泰语", nameEn: "Thai" },
  { code: "tr", name: "土耳其语", nameEn: "Turkish" },
  { code: "uk", name: "乌克兰语", nameEn: "Ukrainian" },
  { code: "uz", name: "乌兹别克语", nameEn: "Uzbek" },
  { code: "vi", name: "越南语", nameEn: "Vietnamese" },
  { code: "zh-TW", name: "繁体中文", nameEn: "Traditional Chinese" },
  { code: "zh-CN", name: "简体中文", nameEn: "Simplified Chinese" },
  { code: "other", name: "其他", nameEn: "Other" },
];

export const DEFAULT_SYSTEM_PROMPT = `你是语种识别助手。根据用户输入的文本，识别其主要使用的语言。

支持识别的语种：
- ar: 阿拉伯语 (Arabic) - 特征：从右到左书写、阿拉伯字母(العربية)
- bg: 保加利亚语 (Bulgarian) - 特征：西里尔字母、特有字母ъ/щ
- de: 德语 (German) - 特征：大量复合词，名词首字母大写
- en: 英语 (English) - 特征：拉丁字母，常见 the/is/are/what/how
- es: 西班牙语 (Spanish) - 特征：倒问号¿、ñ字母、动词变位
- fr: 法语 (French) - 特征：重音符号(é,è,ê)、c软音符(ç)
- hi: 印地语 (Hindi) - 特征：天城文字符(देवनागरी)
- hu: 匈牙利语 (Hungarian) - 特征：特殊字母ő/ű、常见 és/hogy/van
- id: 印尼语 (Indonesian) - 特征：拉丁字母、常见 yang/dan/ini/apa
- it: 意大利语 (Italian) - 特征：双辅音、-zione/-ità结尾
- ja: 日本语 (Japanese) - 特征：平假名、片假名、汉字混合
- nl: 荷兰语 (Dutch) - 特征：ij/ee/oo双元音、-lijk/-heid结尾
- tl: 菲律宾语 (Filipino/Tagalog) - 特征：ng连字符、常见 ang/ng/mga/ako
- pl: 波兰语 (Polish) - 特征：ł/ż/ś/ć等特殊字母
- pt: 葡萄牙语 (Portuguese) - 特征：ão/ções结尾、~波浪号
- ro: 罗马尼亚语 (Romanian) - 特征：特殊字母ă/â/î/ș/ț
- ru: 俄语 (Russian) - 特征：西里尔字母(Кириллица)
- th: 泰语 (Thai) - 特征：泰文字符(ภาษาไทย)、无空格分词
- tr: 土耳其语 (Turkish) - 特征：特殊字母ğ/ı/ş/ü/ö、常见 bir/ve/için
- uk: 乌克兰语 (Ukrainian) - 特征：西里尔字母、特有字母і/є/ї/ґ
- uz: 乌兹别克语 (Uzbek) - 特征：拉丁或西里尔字母、常见 va/uchun
- vi: 越南语 (Vietnamese) - 特征：大量变调符号(à/ả/ã/á/ạ)
- zh-TW: 繁体中文 - 特征：繁体字形(國/學/語/發)
- zh-CN: 简体中文 - 特征：简体字形(国/学/语/发)
- other: 其他 - 无法识别或不在上述列表中的语种

分析要点：
1. 观察文字系统（拉丁/西里尔/汉字/天城文/阿拉伯文等）
2. 检测特征字母和符号
3. 识别常见词汇模式
4. 区分简繁体中文时，注意字形差异
5. 如果文本过短、为空、或无法确定语种，返回 "other"`;

export interface Language {
  code: string;
  name: string;
  nameEn: string;
}

export interface LanguageDetectionConfig {
  languages: Language[];
  systemPrompt: string;
  updatedAt: string;
}

const SETTING_KEY = "language_detection_config";

/**
 * 读取语种识别配置
 * 从数据库读取，不存在则返回默认值
 */
export async function getLanguageDetectionConfig(): Promise<LanguageDetectionConfig> {
  try {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, SETTING_KEY))
      .limit(1);

    const setting = result[0];
    if (setting) {
      const value = setting.value as {
        languages?: Language[];
        systemPrompt?: string;
      };
      return {
        languages: value.languages || DEFAULT_LANGUAGES,
        systemPrompt: value.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        updatedAt: setting.updatedAt.toISOString(),
      };
    }
  } catch (error) {
    console.error("读取语种识别配置失败:", error);
  }

  return {
    languages: DEFAULT_LANGUAGES,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 保存语种识别配置
 * 使用 upsert 写入数据库
 */
export async function saveLanguageDetectionConfig(
  languages: Language[],
  systemPrompt: string,
): Promise<void> {
  const now = new Date();
  await db
    .insert(systemSettings)
    .values({
      key: SETTING_KEY,
      value: { languages, systemPrompt },
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: { languages, systemPrompt },
        updatedAt: now,
      },
    });
}

/**
 * 获取语种列表（用于筛选器选项）
 */
export async function getLanguageOptions(): Promise<Language[]> {
  const config = await getLanguageDetectionConfig();
  return config.languages;
}

/**
 * 根据语种代码获取语种名称
 * 未知语种代码返回"其他"
 */
export function getLanguageName(code: string): string {
  const lang = DEFAULT_LANGUAGES.find((l) => l.code === code);
  return lang?.name || "其他";
}

/**
 * 根据语种代码获取语种英文名称
 * 未知语种代码返回"Other"
 */
export function getLanguageNameEn(code: string): string {
  const lang = DEFAULT_LANGUAGES.find((l) => l.code === code);
  return lang?.nameEn || "Other";
}
