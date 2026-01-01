# 仪表盘公开 API 文档

> 本文档供 AI 编程助手（如 Claude、GPT、Cursor 等）参考，用于帮助开发者调用仪表盘数据接口。

---

## 快速开始（给 AI 的指令）

如果你是 AI 编程助手，用户让你获取仪表盘数据，请按以下步骤操作：

1. **先调用 Schema 接口**获取可用指标列表
2. **再调用数据接口**获取具体数据
3. 所有请求必须携带 `Authorization: Bearer <API_KEY>` 头

---

## API 基础信息

- **Base URL**: `https://your-domain.com`（请替换为实际域名）
- **认证方式**: Bearer Token
- **请求头**: `Authorization: Bearer <API_KEY>`

---

## 接口 1：获取可用指标（Schema 发现）

用于发现当前支持哪些指标，**建议每次使用前先调用此接口**，以获取最新的指标列表。

```http
GET /api/public/dashboard/schema
Authorization: Bearer <API_KEY>
```

### 响应结构

```typescript
interface SchemaResponse {
  version: string;           // API 版本号
  updatedAt: string;         // 最后更新时间
  metrics: {
    [key: string]: {
      name: string;          // 指标中文名
      description: string;   // 指标描述
    }
  }
}
```

### 响应示例

```json
{
  "version": "1.0.0",
  "updatedAt": "2025-12-23T00:00:00Z",
  "metrics": {
    "stats": {
      "name": "核心统计",
      "description": "对话总数、今日新增/小时峰值/日均、独立用户数、独立会话数（含环比对比）"
    },
    "dailyTrend": {
      "name": "每日趋势",
      "description": "按天统计的对话数量趋势，区分生产/开发环境"
    },
    "tagStats": {
      "name": "标签维度统计",
      "description": "平台分布(App/Web)、用户反馈(赞/踩)、页面入口、LLM异常统计"
    },
    "categoryCounts": {
      "name": "意图分类分布",
      "description": "用户问题的意图分类统计（产品咨询、技术支持、订单服务等）"
    }
  }
}
```

---

## 接口 2：获取仪表盘数据

支持 GET 和 POST 两种方式。

### GET 方式

```http
GET /api/public/dashboard?days=7&metrics=stats,dailyTrend
Authorization: Bearer <API_KEY>
```

| 参数    | 类型   | 默认值 | 说明                           |
| ------- | ------ | ------ | ------------------------------ |
| days    | number | 7      | 查询天数范围（1-365）          |
| metrics | string | 全部   | 逗号分隔的指标列表，如 `stats,dailyTrend` |

### POST 方式

```http
POST /api/public/dashboard
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "days": 7,
  "metrics": ["stats", "dailyTrend"]
}
```

| 参数    | 类型     | 默认值 | 说明                  |
| ------- | -------- | ------ | --------------------- |
| days    | number   | 7      | 查询天数范围（1-365） |
| metrics | string[] | 全部   | 要获取的指标数组      |

### 响应结构

```typescript
interface DashboardResponse {
  _meta: {
    days: number;           // 查询的天数
    timestamp: number;      // 响应时间戳（毫秒）
    version: string;        // API 版本
    available: string[];    // 所有可用的指标 key
  };
  data: {
    stats?: StatsData;
    dailyTrend?: DailyTrendData[];
    tagStats?: TagStatsData;
    categoryCounts?: Record<string, number>;
  };
}

// stats 指标数据结构
interface StatsData {
  days: number;
  secondMetricType: "todayCount" | "hourlyPeak" | "dailyAvg";
  totalCount: MetricWithChange;
  secondMetric: MetricWithChange;
  uniqueUsers: MetricWithChange;
  uniqueSessions: MetricWithChange;
}

interface MetricWithChange {
  current: number;   // 当前周期值
  previous: number;  // 上一周期值
  change: number;    // 环比变化百分比
}

// dailyTrend 指标数据结构
interface DailyTrendData {
  date: string;      // 日期 YYYY-MM-DD
  total: number;     // 总对话数
  prodCount: number; // 生产环境数
  devCount: number;  // 开发环境数
}

// tagStats 指标数据结构
interface TagStatsData {
  platform: { App: number; Web: number; Other: number };
  pageEntry: Record<string, number>;
  feedback: { like: number; dislike: number };
  llmErrors: { total: number; types: Record<string, number> };
  interaction: { guessQuestion: number; direct: number };
}
```

### 响应示例

```json
{
  "_meta": {
    "days": 7,
    "timestamp": 1703318400000,
    "version": "1.0.0",
    "available": ["stats", "dailyTrend", "tagStats", "categoryCounts"]
  },
  "data": {
    "stats": {
      "days": 7,
      "secondMetricType": "todayCount",
      "totalCount": { "current": 12421, "previous": 13711, "change": -9.4 },
      "secondMetric": { "current": 1064, "previous": 1661, "change": -35.9 },
      "uniqueUsers": { "current": 4944, "previous": 5614, "change": -11.9 },
      "uniqueSessions": { "current": 7120, "previous": 7989, "change": -10.9 }
    },
    "dailyTrend": [
      { "date": "2025-12-17", "total": 2134, "prodCount": 2133, "devCount": 1 },
      { "date": "2025-12-18", "total": 2128, "prodCount": 2114, "devCount": 14 }
    ],
    "tagStats": {
      "platform": { "App": 8000, "Web": 4000, "Other": 421 },
      "feedback": { "like": 500, "dislike": 100 },
      "pageEntry": { "stationDetailPage": 3000, "copilotPage": 2000 },
      "llmErrors": { "total": 50, "types": { "NO_KNOWLEDGE": 30, "None": 20 } },
      "interaction": { "guessQuestion": 1000, "direct": 11421 }
    },
    "categoryCounts": {
      "product_inquiry": 4000,
      "technical_support": 3500,
      "order_service": 2000,
      "complaint": 500,
      "other": 2421
    }
  }
}
```

---

## 代码示例

### Python

```python
import requests

API_URL = "https://your-domain.com/api/public/dashboard"
API_KEY = "your-api-key"

headers = {"Authorization": f"Bearer {API_KEY}"}

# 获取最近 7 天的所有指标
response = requests.post(API_URL, headers=headers, json={"days": 7})
data = response.json()

# 获取核心统计
stats = data["data"]["stats"]
print(f"总对话数: {stats['totalCount']['current']}")
print(f"环比变化: {stats['totalCount']['change']:.1f}%")

# 获取每日趋势
for day in data["data"]["dailyTrend"]:
    print(f"{day['date']}: {day['total']} 条对话")
```

### JavaScript / TypeScript

```typescript
const API_URL = "https://your-domain.com/api/public/dashboard";
const API_KEY = "your-api-key";

async function getDashboardData(days = 7, metrics?: string[]) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ days, metrics }),
  });
  return response.json();
}

// 使用示例
const data = await getDashboardData(7, ["stats", "dailyTrend"]);
console.log("总对话数:", data.data.stats.totalCount.current);
```

### cURL

```bash
# 获取 Schema（查看有哪些指标可用）
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://your-domain.com/api/public/dashboard/schema"

# 获取所有数据（最近 7 天）
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}' \
  "https://your-domain.com/api/public/dashboard"

# 只获取核心统计和每日趋势
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "metrics": ["stats", "dailyTrend"]}' \
  "https://your-domain.com/api/public/dashboard"
```

---

## 指标详解

| Key            | 名称         | 说明                                                         |
| -------------- | ------------ | ------------------------------------------------------------ |
| stats          | 核心统计     | 对话总数、今日新增（或小时峰值/日均）、独立用户数、独立会话数，均含环比 |
| dailyTrend     | 每日趋势     | 按天统计的对话量数组，区分生产/开发环境                      |
| tagStats       | 标签维度统计 | 平台分布、用户反馈、页面入口来源、LLM 异常类型统计           |
| categoryCounts | 意图分类分布 | 用户问题的意图分类计数（如产品咨询、技术支持等）             |

---

## 错误处理

| HTTP 状态码 | 错误信息       | 说明                    |
| ----------- | -------------- | ----------------------- |
| 401         | Unauthorized   | API Key 无效或未提供    |
| 500         | Internal Error | 服务器内部错误，请重试  |

---

## 更新日志

- **v1.0.0** (2025-12-23): 初始版本
  - 支持指标：stats、dailyTrend、tagStats、categoryCounts
  - 支持 Schema 发现接口
  - 支持按需获取指标
