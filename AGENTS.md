<coding_guidelines>

## 名词解释

- 对话（Trace）：用户与ai的一问一答
- 会话（Session）：用户与ai的多轮对话

## 须知

- 大模型翻译、意图分类功能使用 OpenAI 兼容的 API，可配置为任意支持的 LLM 服务
- 执行 `pnpm dev` 启动开发服务器，默认端口 12138

## 环境区分

| 环境 | 地址 | 用途 | 任务自动启动 |
| ---- | ---- | ---- | ------------ |
| **本地开发** | `localhost:12138` | 开发测试 | 关闭 (false) |
| **生产环境** | 自定义 | 生产部署 | 开启 (true) |

### 本地开发环境

```bash
pnpm dev                    # 启动开发服务器
```

- `AUTH_URL="http://localhost:12138"`
- 任务自动启动全部关闭

### 生产环境

```bash
pnpm build && pnpm start -p 12138 -H 0.0.0.0
```

- 配置 `AUTH_URL` 为实际域名
- 任务自动启动开启，后台处理翻译/分类/语种识别

## 权限系统

系统采用基于角色的权限控制（RBAC），分为三种角色：

| 角色 | 权限范围 |
| ---- | -------- |
| **superadmin（超级管理员）** | 可访问全部功能：仪表盘、对话、会话、用户、数据集、设置 |
| **admin（管理员）** | 可访问：仪表盘、对话、会话、用户、数据集（不可访问设置） |
| **user（普通用户）** | 仅可访问仪表盘 |

### 账号信息

- **超级管理员账号**: 通过 seed 脚本创建，参见 `.env.demo.example`
- **普通用户**: 可自行注册，默认为 user 角色，需超级管理员在「设置 → 账号管理」中授权

## Git 工作流

### 提交信息规范

| 前缀 | 用途 |
| ---- | ---- |
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `chore` | 杂项（配置、依赖等） |
| `docs` | 文档更新 |
| `refactor` | 重构 |

## 重要规范与文档

遵循 `.factory/rules/` 中的规范：

| 规范类型              | 文件路径                               | 说明                 |
| --------------------- | -------------------------------------- | -------------------- |
| **代码结构**    | `.factory/rules/file-structure.md`   | 文件长度与模块化规范 |
| **React 指南**  | `.factory/rules/react-guidelines.md` | React 基础编码规范   |
| **React 模式**  | `.factory/rules/react-patterns.md`   | React 最佳实践与模式 |
| **测试规范**    | `.factory/rules/testing.md`          | 测试编写规范         |
| **shadcn/ui**   | `.factory/rules/shadcnui.md`         | UI 组件库使用规范    |
| **AI Elements** | `.factory/rules/ai-elements.md`      | AI 组件使用规范      |
| **技术栈**      | `.factory/rules/技术栈.md`           | 项目技术栈说明       |

</coding_guidelines>
