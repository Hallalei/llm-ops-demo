export const unknownError = "发生未知错误，请稍后重试。";

// 数据库 schema 名称 - Demo 模式使用 public，生产环境使用远程 schema
export const databaseSchema = process.env.DATABASE_SCHEMA || "public";

// Demo 模式标识
export const isDemoMode = process.env.DEMO_MODE === "true";

// 对话表名 - Demo 模式使用英文表名，生产环境使用中文表名
export const conversationsTableName = isDemoMode
  ? "conversations"
  : "灵思 实时数据";

// 不使用表前缀 (远程数据库已有表)
export const databasePrefix = "";

// 批处理任务的起始日期（只处理该日期之后的记录）
export const PROCESSING_START_DATE = "2025-12-01";

// 默认 System Prompts
export const DEFAULT_PROMPTS = {
  translation: `你是专业翻译助手。请将用户提问和AI回答分别翻译成中文。
返回严格的JSON格式,不要添加任何其他内容：
{"queryZh": "翻译后的提问", "responseZh": "翻译后的回答"}`,
  classification: `你是意图分类助手。根据用户提问，判断其意图类别。
请仔细分析用户的问题内容，选择最匹配的类别。`,
  languageDetection: `你是语种识别助手。根据用户输入的文本，识别其主要使用的语言。

支持识别的语种：
- de: 德语 (German) - 特征：大量复合词，名词首字母大写
- en: 英语 (English) - 特征：拉丁字母，常见 the/is/are/what/how
- es: 西班牙语 (Spanish) - 特征：倒问号¿、ñ字母、动词变位
- fr: 法语 (French) - 特征：重音符号(é,è,ê)、c软音符(ç)
- hi: 印地语 (Hindi) - 特征：天城文字符(देवनागरी)
- id: 印尼语 (Indonesian) - 特征：拉丁字母、常见 yang/dan/ini/apa
- it: 意大利语 (Italian) - 特征：双辅音、-zione/-ità结尾
- ja: 日本语 (Japanese) - 特征：平假名、片假名、汉字混合
- nl: 荷兰语 (Dutch) - 特征：ij/ee/oo双元音、-lijk/-heid结尾
- tl: 菲律宾语 (Filipino/Tagalog) - 特征：ng连字符、常见 ang/ng/mga/ako
- pl: 波兰语 (Polish) - 特征：ł/ż/ś/ć等特殊字母
- pt: 葡萄牙语 (Portuguese) - 特征：ão/ções结尾、~波浪号
- ru: 俄语 (Russian) - 特征：西里尔字母(Кириллица)
- th: 泰语 (Thai) - 特征：泰文字符(ภาษาไทย)、无空格分词
- uk: 乌克兰语 (Ukrainian) - 特征：西里尔字母、特有字母і/є/ї/ґ
- uz: 乌兹别克语 (Uzbek) - 特征：拉丁或西里尔字母、常见 va/uchun
- vi: 越南语 (Vietnamese) - 特征：大量变调符号(à/ả/ã/á/ạ)
- zh-TW: 繁体中文 - 特征：繁体字形(國/學/語/發)
- zh-CN: 简体中文 - 特征：简体字形(国/学/语/发)
- other: 其他 - 无法识别或不在上述列表中的语种

分析要点：
1. 观察文字系统（拉丁/西里尔/汉字/天城文等）
2. 检测特征字母和符号
3. 识别常见词汇模式
4. 区分简繁体中文时，注意字形差异
5. 如果文本过短、为空、或无法确定语种，返回 "other"`,
};
