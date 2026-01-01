# Deye LLM Ops

AI 对话记录预览系统 - 灵思智能客服对话数据管理平台

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hallalei/llm-ops-demo&env=DATABASE_URL,AUTH_SECRET,DEMO_MODE,DATABASE_SCHEMA&envDescription=Demo%20environment%20variables&envLink=https://github.com/hallalei/llm-ops-demo%23environment-variables)

## Demo

> **在线演示**: [https://lyon-mu.vercel.app](https://lyon-mu.vercel.app)
>
> **登录凭证**:
> - Admin: `demo@example.com` / `DemoPassword123!`
> - Viewer: `viewer@example.com` / `ViewerPass123!`

## 功能特性

- **仪表盘** - 对话统计、趋势分析、Token 用量、意图分布、平台分布
- **对话管理 (Traces)** - 单轮对话查看、高级筛选、翻译、意图分类、语种识别
- **会话管理 (Sessions)** - 多轮对话聚合、上下文查看、会话详情
- **用户管理 (Users)** - 终端用户查看、对话统计、会话记录
- **数据集 (Datasets)** - 对话样本收集、版本管理、数据导出
- **设置** - 翻译/分类/语种识别配置、账号管理

## 技术栈

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **Database:** [PostgreSQL](https://www.postgresql.org) + [Drizzle ORM](https://orm.drizzle.team)
- **Auth:** [NextAuth.js v5](https://authjs.dev) (RBAC 权限控制)
- **UI:** [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS 4](https://tailwindcss.com)
- **Table:** [TanStack Table](https://tanstack.com/table/latest) + [TanStack Virtual](https://tanstack.com/virtual/latest)
- **AI:** V-API (GLM-4-Flash) - 翻译、意图分类、语种识别
- **Validation:** [Zod](https://zod.dev)

## 快速开始（Demo 模式）

### 方法 1: 一键脚本

```bash
git clone https://github.com/hallalei/llm-ops-demo.git
cd lyon
./scripts/setup-demo.sh
```

### 方法 2: 手动设置

```bash
# 1. 克隆项目
git clone https://github.com/hallalei/llm-ops-demo.git
cd lyon

# 2. 配置环境变量
cp .env.demo.example .env
# 编辑 .env，填写数据库连接信息

# 3. 安装依赖
pnpm install

# 4. 初始化数据库
pnpm db:push
pnpm db:seed:demo

# 5. 启动开发服务器
pnpm dev
```

访问 http://localhost:12138

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | 是 | NextAuth.js 密钥（`openssl rand -base64 32`） |
| `DEMO_MODE` | 否 | 设为 `"true"` 启用 Demo 模式 |
| `DATABASE_SCHEMA` | 否 | 数据库 schema，默认 `"public"` |
| `AUTH_URL` | 否 | 应用 URL（生产环境需要） |
| `AUTH_TRUST_HOST` | 否 | 设为 `"true"` 信任代理 |

## 一键部署

### Vercel + Neon

1. 点击上方 "Deploy with Vercel" 按钮
2. 在 [Neon](https://neon.tech) 创建免费 PostgreSQL 数据库
3. 配置环境变量：
   - `DATABASE_URL`: Neon 连接字符串
   - `AUTH_SECRET`: 生成一个随机密钥
   - `DEMO_MODE`: `true`
   - `DATABASE_SCHEMA`: `public`
4. 部署完成后，在 Vercel CLI 运行初始化：
   ```bash
   vercel env pull
   pnpm db:push
   pnpm db:seed:demo
   ```

### Railway

```bash
railway login
railway init
railway add --database postgres
railway up
```

### Docker

```bash
# 启动数据库
pnpm db:start

# 初始化
pnpm db:setup:demo

# 启动应用
pnpm dev
```

## 生产部署

### 构建项目

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start -p 12138 -H 0.0.0.0
```

### 局域网访问

```
http://<服务器IP>:12138
```

## 权限系统

系统采用基于角色的权限控制（RBAC）：

| 角色 | 权限范围 |
| ---- | -------- |
| **superadmin** | 全部功能 + 系统管理 |
| **admin** | 全部功能：仪表盘、对话、会话、用户、数据集、设置 |
| **user** | 仅可访问仪表盘 |

### Demo 账号

- **管理员**: `demo@example.com` / `DemoPassword123!`
- **查看者**: `viewer@example.com` / `ViewerPass123!`

## 常用命令

```bash
# 开发
pnpm dev              # 开发模式 (localhost:12138)
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 代码质量
pnpm lint             # 代码检查
pnpm typecheck        # 类型检查
pnpm check            # lint + typecheck

# 数据库
pnpm db:start         # 启动 Docker 数据库
pnpm db:push          # 同步数据库结构
pnpm db:seed          # 运行基础 seed
pnpm db:seed:demo     # 运行 Demo seed（含示例数据）
pnpm db:setup:demo    # 一键初始化 Demo
pnpm db:studio        # Drizzle Studio
pnpm db:reset         # 重置数据库
```

## 项目结构

```
lyon/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (main)/          # 主应用（仪表盘、对话等）
│   │   ├── (auth)/          # 认证页面
│   │   └── api/             # API 路由
│   ├── components/          # React 组件
│   ├── db/                  # 数据库（schema、seed）
│   ├── lib/                 # 工具库
│   └── env.js               # 环境变量验证
├── scripts/                 # 部署脚本
├── .env.demo.example        # Demo 环境变量模板
└── vercel.json              # Vercel 部署配置
```

## License

MIT
