# 对话翻译功能说明

## 功能概述

实现对话记录的中英文翻译功能，支持批量翻译和进度查询。

## 架构设计

### 数据库设计

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│  灵思 实时数据          │         │  conversation_translations   │
│  (原表,只读)            │◄────────│  (翻译表,可写)               │
├─────────────────────────┤         ├──────────────────────────────┤
│  id (PK)                │         │  id (PK, SERIAL)             │
│  query                  │         │  conversation_id (FK, UNIQUE)│
│  response               │         │  query_zh                    │
│  ...                    │         │  response_zh                 │
└─────────────────────────┘         │  status                      │
                                    │  created_at                  │
                                    │  updated_at                  │
                                    └──────────────────────────────┘
```

**设计优势**：
- 不修改原表结构，保持数据完整性
- 通过 LEFT JOIN 获取翻译，性能良好
- 支持增量翻译，可随时添加新记录

### 翻译状态

| 状态       | 说明                 |
|-----------|---------------------|
| pending   | 待翻译（初始状态）    |
| completed | 翻译完成             |
| failed    | 翻译失败             |

## API 接口

### 1. 批量翻译

```http
POST /api/translate
Authorization: Bearer <TRANSLATE_SECRET>
Content-Type: application/json

{
  "batchSize": 10  // 可选，默认 10，范围 1-100
}
```

**响应示例**：
```json
{
  "success": 10,
  "failed": 0,
  "skipped": 0,
  "remaining": 36505,
  "message": "成功翻译 10 条，失败 0 条，剩余 36505 条"
}
```

### 2. 查询进度

```http
GET /api/translate
Authorization: Bearer <TRANSLATE_SECRET>
```

**响应示例**：
```json
{
  "total": 36515,
  "completed": 10,
  "failed": 0,
  "pending": 36505,
  "completionRate": "0.03%"
}
```

## 前端展示

### 表格视图
- **提问(中文)** 列：显示翻译后的提问
- **回答(中文)** 列：显示翻译后的回答
- 未翻译时显示 `-`

### 详情弹窗
- 原文和译文对照显示
- 已翻译显示"已翻译"标识
- 蓝色背景区分译文

## 翻译逻辑

### 智能检测

```typescript
function needsTranslation(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const ratio = chineseChars.length / text.length;
  return ratio < 0.5; // 中文占比低于 50% 才翻译
}
```

### 处理流程

1. 从数据库获取待翻译记录（未在翻译表中的）
2. 检测是否需要翻译（中文占比）
3. 调用 DeepSeek API 进行翻译
4. 保存翻译结果到 conversation_translations 表
5. 失败时记录 failed 状态

## 使用指南

### 手动触发翻译

```bash
# 翻译 10 条记录
curl -X POST "http://localhost:3000/api/translate" \
  -H "Authorization: Bearer deye-translate-secret-2024" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

### 批量翻译脚本

```bash
#!/bin/bash
# 批量翻译所有记录（每次 50 条）

SECRET="deye-translate-secret-2024"
API="http://localhost:3000/api/translate"

while true; do
  result=$(curl -s -X POST "$API" \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    -d '{"batchSize": 50}')
  
  remaining=$(echo $result | jq -r '.remaining')
  echo "剩余: $remaining 条"
  
  if [ "$remaining" -eq 0 ]; then
    echo "翻译完成！"
    break
  fi
  
  sleep 2  # 避免过快调用 API
done
```

### 查询进度

```bash
curl -X GET "http://localhost:3000/api/translate" \
  -H "Authorization: Bearer deye-translate-secret-2024"
```

## 环境配置

`.env` 文件需添加：

```env
# DeepSeek API Key
DEEPSEEK_API_KEY="your-deepseek-api-key"

# 翻译 API 密钥
TRANSLATE_SECRET="your-secret-key"
```

## 文件结构

```
src/
├── app/
│   ├── api/translate/
│   │   └── route.ts                    # 翻译 API 路由
│   ├── components/
│   │   ├── conversations-table-columns.tsx   # 添加翻译列
│   │   └── conversation-detail-dialog.tsx    # 显示翻译内容
│   └── lib/
│       └── queries.ts                  # LEFT JOIN 翻译表
├── db/
│   └── schema.ts                       # 翻译表定义
├── lib/
│   └── translation/
│       ├── deepseek.ts                 # DeepSeek API 封装
│       └── service.ts                  # 翻译服务层
└── scripts/
    └── migrate-translation-table.ts    # 创建翻译表脚本
```

## 性能考虑

- **批量大小**：建议 10-50 条/批次
- **API 限流**：注意 DeepSeek API 调用频率限制
- **并发控制**：当前为串行处理，可优化为并发
- **缓存策略**：翻译结果永久保存，无需重复翻译

## 后续优化方向

1. **定时任务**：使用 cron job 自动批量翻译
2. **进度可视化**：在前端添加翻译进度条
3. **质量优化**：调整 DeepSeek prompt 提升翻译质量
4. **错误处理**：增加重试机制和错误日志
5. **并发翻译**：使用 Promise.all 并发处理
6. **翻译缓存**：对相似内容使用缓存

## 故障排查

### 翻译表不存在

```bash
cd "/Users/leizi/Desktop/Deye LLM Ops"
npx tsx scripts/migrate-translation-table.ts
```

### API 返回 401

检查 `.env` 文件中的 `TRANSLATE_SECRET` 配置

### 翻译失败

1. 检查 DeepSeek API Key 是否有效
2. 查看服务器日志错误信息
3. 检查网络连接

## 成本估算

- DeepSeek API：约 ¥0.001/1000 tokens
- 36,515 条记录，平均 200 tokens/条
- 总成本：约 ¥7.3

---

*文档更新时间：2025-12-02*
