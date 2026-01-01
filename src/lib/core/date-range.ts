import { endOfDay, format, startOfDay, subDays, subHours } from "date-fns";

/**
 * 日期范围预设选项
 */
export const DATE_RANGE_PRESETS = [
  { label: "全部", value: "all", days: 0 },
  { label: "近 24h", value: "24h", hours: 24 },
  { label: "近 7 天", value: "7d", days: 7 },
  { label: "近 30 天", value: "30d", days: 30 },
  { label: "近 90 天", value: "90d", days: 90 },
] as const;

export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number]["value"];

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

/**
 * 根据预设值获取日期范围
 * @param preset 预设值 (all, 24h, 7d, 30d, 90d)
 * @returns 日期范围对象
 */
export function getDateRangeFromPreset(preset: string): DateRange {
  const now = new Date();
  const today = endOfDay(now);

  switch (preset) {
    case "24h":
      return {
        from: subHours(now, 24),
        to: today,
      };
    case "7d":
      return {
        from: startOfDay(subDays(now, 6)),
        to: today,
      };
    case "30d":
      return {
        from: startOfDay(subDays(now, 29)),
        to: today,
      };
    case "90d":
      return {
        from: startOfDay(subDays(now, 89)),
        to: today,
      };
    default:
      return {
        from: null,
        to: null,
      };
  }
}

/**
 * 根据预设值判断是否匹配给定的日期范围
 * @param preset 预设值
 * @param from 开始日期字符串
 * @param to 结束日期字符串
 * @returns 是否匹配
 */
export function matchesPreset(
  preset: string,
  from: string | null,
  to: string | null,
): boolean {
  if (preset === "all") {
    return !from && !to;
  }

  if (!from || !to) {
    return false;
  }

  const range = getDateRangeFromPreset(preset);
  if (!range.from || !range.to) {
    return false;
  }

  const expectedFrom = format(range.from, "yyyy-MM-dd");
  const expectedTo = format(range.to, "yyyy-MM-dd");

  return from === expectedFrom && to === expectedTo;
}

/**
 * 获取当前选中的预设值
 * @param from 开始日期字符串
 * @param to 结束日期字符串
 * @returns 匹配的预设值或 "custom"
 */
export function getCurrentPreset(
  from: string | null | undefined,
  to: string | null | undefined,
): DateRangePreset | "custom" {
  // 没有日期参数时返回 "all"
  if (!from && !to) {
    return "all";
  }

  // 检查是否匹配某个预设
  for (const preset of DATE_RANGE_PRESETS) {
    if (matchesPreset(preset.value, from ?? null, to ?? null)) {
      return preset.value;
    }
  }

  // 有日期但不匹配任何预设，返回 "custom"
  return "custom";
}

/**
 * 解析 URL 参数中的日期字符串为 Date 对象
 * @param from 开始日期字符串 (yyyy-MM-dd)
 * @param to 结束日期字符串 (yyyy-MM-dd)
 * @returns 解析后的日期范围
 */
export function parseDateRangeParams(
  from?: string | null,
  to?: string | null,
): DateRange {
  return {
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
  };
}

/**
 * 格式化日期范围为显示文本
 * @param from 开始日期
 * @param to 结束日期
 * @returns 格式化后的显示文本
 */
export function formatDateRange(from?: Date | null, to?: Date | null): string {
  if (!from && !to) {
    return "全部";
  }

  if (from && to) {
    return `${format(from, "MM/dd")} - ${format(to, "MM/dd")}`;
  }

  if (from) {
    return `${format(from, "MM/dd")} 起`;
  }

  if (to) {
    return `至 ${format(to, "MM/dd")}`;
  }
  return "全部";
}

/**
 * 格式化日期为 URL 参数格式 (yyyy-MM-dd)
 */
export function formatDateForUrl(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
