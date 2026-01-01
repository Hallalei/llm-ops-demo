# 自动翻译定时任务

## 功能说明

在 Next.js 服务启动时自动启动后台定时任务,定期批量翻译对话记录。2025-12-01之前的trace不需要翻译，只翻译发生在2025-12-02的trace

## 技术实现

- **定时库**: `node-cron`
- **初始化**: Next.js `instrumentation.ts` (服务端 hook)
- **翻译服务**: `src/lib/translation/service.ts`
- **调度**: 每 5 分钟执行一次 (可配置)

## 环境变量

```env
# 启用自动翻译 (默认: false)
ENABLE_AUTO_TRANSLATE="true"

# 执行间隔 (默认: 每5分钟)
# Cron 表达式: "分 时 日 月 周"
TRANSLATE_CRON_SCHEDULE="*/5 * * * *"

# 每次翻译条数 (默认: 20)
TRANSLATE_BATCH_SIZE="20"
```

### Cron 表达式示例

```
* * * * *      # 每分钟
*/5 * * * *    # 每5分钟
*/10 * * * *   # 每10分钟
0 * * * *      # 每小时
0 */2 * * *    # 每2小时
0 0 * * *      # 每天凌晨
```

## 使用方法

### 1. 启用定时任务

在 `.env` 中设置:

```env
ENABLE_AUTO_TRANSLATE="true"
```

### 2. 启动服务

```bash
pnpm dev
# 或
pnpm start
```

### 3. 查看日志

启动时会输出:

```
[Instrumentation] 正在启动服务端后台任务...
[Instrumentation] ✅ 定时任务已启动: */5 * * * * (每批 20 条)
```

执行时会输出:

```
[定时任务] 2025/12/2 11:18:00 开始批量翻译，批次大小: 20
[定时任务] 2025/12/2 11:18:35 翻译完成 - 成功: 15, 失败: 0, 跳过: 5, 剩余: 36485
[定时任务] 进度: 0.12% (已翻译 20/36505)
```

### 4. 禁用定时任务

在 `.env` 中设置:

```env
ENABLE_AUTO_TRANSLATE="false"
```

## 工作原理

1. **服务启动**: Next.js 调用 `src/instrumentation.ts` 的 `register()` 函数
2. **检查配置**: 读取 `ENABLE_AUTO_TRANSLATE` 环境变量
3. **注册定时任务**: 使用 `node-cron` 注册定时任务
4. **执行翻译**:
   - 调用 `batchTranslate(batchSize)`
   - 从数据库获取待翻译记录
   - 调用 DeepSeek API 翻译
   - 保存翻译结果
5. **输出日志**: 显示翻译统计和进度

## 目录结构

```
src/
├── instrumentation.ts          # Next.js 服务端初始化 hook
├── lib/
│   └── translation/
│       ├── service.ts          # 翻译服务层
│       └── deepseek.ts         # DeepSeek API 封装
└── app/
    └── api/
        └── translate/
            └── route.ts        # 手动翻译 API 接口
```

## 监控翻译进度

使用 API 查询:

```bash
curl -X GET "http://localhost:3000/api/translate" \
  -H "Authorization: Bearer your-secret-token"
```

响应:

```json
{
  "total": 36542,
  "completed": 54,
  "failed": 0,
  "pending": 36488,
  "completionRate": "0.15%"
}
```

## 性能优化建议

1. **批次大小**:

   - 小批次 (10-20): 内存占用低,日志详细
   - 大批次 (50-100): 处理速度快,但可能阻塞
2. **执行间隔**:

   - 高频 (1-5分钟): 快速完成翻译
   - 低频 (30-60分钟): 减少 API 调用
3. **生产环境建议**:

   ```env
   TRANSLATE_CRON_SCHEDULE="*/10 * * * *"  # 每10分钟
   TRANSLATE_BATCH_SIZE="50"                # 每次50条
   ```

## 故障排查

### 定时任务未启动

检查:

1. `ENABLE_AUTO_TRANSLATE` 是否为 `"true"`
2. `.env` 文件是否存在
3. 启动日志中是否有错误

### 翻译失败

检查:

1. `DEEPSEEK_API_KEY` 是否正确
2. 数据库连接是否正常
3. 查看错误日志

### 日志不显示

检查:

1. 确认定时任务已触发 (查看时间戳)
2. 可能翻译耗时较长,等待完成
3. 检查 `batchTranslate()` 是否有错误

## 安全性

- ✅ 只在服务端运行,不暴露给客户端
- ✅ 使用环境变量控制开关
- ✅ API 密钥通过 `.env` 安全存储
- ✅ 支持通过配置完全禁用

## 相关文档

- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [node-cron 文档](https://github.com/node-cron/node-cron)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
