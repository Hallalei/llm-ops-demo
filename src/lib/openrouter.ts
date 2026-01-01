import { format, subDays } from "date-fns";
import { unstable_cache } from "next/cache";
import { env } from "@/env";

export interface TokenUsageData {
  date: string;
  tokens: number;
  requests: number;
  spend: number;
}

interface OpenRouterActivityResponse {
  data: {
    usage: number;
    requests: number;
    prompt_tokens: number;
    completion_tokens: number;
    model?: string;
  }[];
}

const fetchDailyUsage = unstable_cache(
  async (dateStr: string): Promise<TokenUsageData> => {
    if (!env.OPENROUTER_KEY) {
      console.warn("OPENROUTER_KEY not configured");
      return { date: dateStr, tokens: 0, requests: 0, spend: 0 };
    }

    try {
      const response = await fetch(
        `https://openrouter.ai/api/v1/activity?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_KEY}`,
          },
          next: { revalidate: 3600 * 24 }, // Cache for 24 hours as historical data shouldn't change
        },
      );

      if (!response.ok) {
        console.error(
          `OpenRouter API error for ${dateStr}: ${response.status} ${response.statusText}`,
        );
        return { date: dateStr, tokens: 0, requests: 0, spend: 0 };
      }

      const data = (await response.json()) as OpenRouterActivityResponse;

      let tokens = 0;
      let requests = 0;
      let spend = 0;

      for (const item of data.data || []) {
        tokens += (item.prompt_tokens || 0) + (item.completion_tokens || 0);
        requests += item.requests || 0;
        spend += Number(item.usage) || 0;
      }

      return {
        date: dateStr,
        tokens,
        requests,
        spend,
      };
    } catch (error) {
      console.error(`Failed to fetch OpenRouter data for ${dateStr}:`, error);
      return { date: dateStr, tokens: 0, requests: 0, spend: 0 };
    }
  },
  ["openrouter-daily-usage"],
  { revalidate: 3600 }, // Default revalidate
);

export async function getTokenUsageHistory(
  days: number,
): Promise<TokenUsageData[]> {
  // days=1 表示近24小时，按小时粒度返回
  if (days === 1) {
    return getHourlyTokenUsage();
  }

  const dates: string[] = [];
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // days=0 表示全部，默认显示30天
  // 限制最大天数为 365 天，避免请求过多历史数据
  const effectiveDays = days === 0 ? 30 : Math.min(days, 365);

  for (let i = effectiveDays - 1; i >= 0; i--) {
    const dateStr = format(subDays(today, i), "yyyy-MM-dd");
    // 只添加不超过今天的日期，避免请求未来日期导致 API 400 错误
    if (dateStr <= todayStr) {
      dates.push(dateStr);
    }
  }

  const results = await Promise.all(
    dates.map(async (dateStr) => {
      if (dateStr === todayStr) {
        const result = await fetchDailyUsageToday(dateStr);
        return result;
      } else {
        return fetchDailyUsage(dateStr);
      }
    }),
  );

  return results.map((r) => ({
    ...r,
    date: format(new Date(r.date), "MM-dd"),
  }));
}

// 获取近24小时的Token使用情况（显示今天和昨天的数据）
async function getHourlyTokenUsage(): Promise<TokenUsageData[]> {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");

  // 获取今天和昨天的数据
  const [todayData, yesterdayData] = await Promise.all([
    fetchDailyUsageToday(todayStr),
    fetchDailyUsage(yesterdayStr),
  ]);

  // 返回两天的数据作为近24小时的展示
  return [
    {
      date: format(subDays(today, 1), "MM-dd"),
      tokens: yesterdayData.tokens,
      requests: yesterdayData.requests,
      spend: yesterdayData.spend,
    },
    {
      date: format(today, "MM-dd"),
      tokens: todayData.tokens,
      requests: todayData.requests,
      spend: todayData.spend,
    },
  ];
}

// Uncached or short-cached version for today
async function fetchDailyUsageToday(dateStr: string): Promise<TokenUsageData> {
  if (!env.OPENROUTER_KEY)
    return { date: dateStr, tokens: 0, requests: 0, spend: 0 };

  return unstable_cache(
    async () => {
      try {
        const response = await fetch(
          `https://openrouter.ai/api/v1/activity?date=${dateStr}`,
          { headers: { Authorization: `Bearer ${env.OPENROUTER_KEY}` } },
        );
        if (!response.ok)
          return { date: dateStr, tokens: 0, requests: 0, spend: 0 };
        const data = (await response.json()) as OpenRouterActivityResponse;

        let tokens = 0,
          requests = 0,
          spend = 0;
        for (const item of data.data || []) {
          tokens += (item.prompt_tokens || 0) + (item.completion_tokens || 0);
          requests += item.requests || 0;
          spend += Number(item.usage) || 0;
        }
        return { date: dateStr, tokens, requests, spend };
      } catch {
        return { date: dateStr, tokens: 0, requests: 0, spend: 0 };
      }
    },
    [`openrouter-daily-usage-${dateStr}`],
    { revalidate: 60 },
  )();
}

export interface Last24hTokenStats {
  current: number;
  previous: number;
  change: number;
}

export async function getLast24hTokenStats(): Promise<Last24hTokenStats> {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");

  const [todayData, yesterdayData] = await Promise.all([
    fetchDailyUsageToday(todayStr),
    fetchDailyUsage(yesterdayStr),
  ]);

  const current = todayData.tokens + yesterdayData.tokens;
  const dayBeforeYesterdayStr = format(subDays(today, 2), "yyyy-MM-dd");
  const dayBeforeYesterdayData = await fetchDailyUsage(dayBeforeYesterdayStr);
  const previous = yesterdayData.tokens + dayBeforeYesterdayData.tokens;

  const change =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : ((current - previous) / previous) * 100;

  return { current, previous, change };
}
