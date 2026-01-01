---
description: AI Elements (Vercel AI SDK) 组件使用规范
globs: "**/*.tsx"
alwaysApply: false
---

# AI Elements (Vercel AI SDK)

> AI Elements 是 Vercel 基于 shadcn/ui 构建的开源组件库，专为构建 AI 原生应用设计。提供预构建、可定制的 React 组件，帮助快速构建 Chatbot、Workflow 等 AI 界面。

## 官方资源

- 文档: https://ai-sdk.dev/elements
- 使用指南: https://ai-sdk.dev/elements/usage
- Chatbot 示例: https://ai-sdk.dev/elements/examples/chatbot
- GitHub: https://github.com/vercel/ai-elements

---

## 安装方式

### CLI 安装 (推荐)

```bash
# 交互式安装所有组件
npx ai-elements@latest

# 安装指定组件
npx ai-elements@latest add <component-name>

# 可用组件: conversation, message, prompt-input, code-block, model-selector 等
```

### shadcn CLI 安装

```bash
npx shadcn@latest add @ai-elements/all
```

### 前置要求

- Node.js 18+
- Next.js 项目
- AI SDK (`ai` 包)
- shadcn/ui 已初始化
- Tailwind CSS 已配置

---

## 核心组件

### 1. Conversation (对话容器)

对话消息列表的容器组件。

```tsx
import { Conversation } from "@/components/ai-elements/conversation";

<Conversation>
  {messages.map((message) => (
    <Message key={message.id} {...message} />
  ))}
</Conversation>
```

### 2. Message (消息组件)

单条消息的展示组件，支持用户和助手角色。

```tsx
import { Message, MessageContent } from "@/components/ai-elements/message";

<Message role="user">
  <MessageContent>用户消息内容</MessageContent>
</Message>

<Message role="assistant">
  <MessageContent>{assistantMessage}</MessageContent>
</Message>
```

**Props:**
- `role`: `"user"` | `"assistant"` - 消息角色
- `className`: 自定义样式类

### 3. PromptInput (输入框组件)

完整的消息输入组件，包含文本框、工具栏和提交按钮。

```tsx
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

<PromptInput
  value={input}
  onValueChange={setInput}
  onSubmit={handleSubmit}
>
  <PromptInputTextarea placeholder="输入消息..." />
  <PromptInputFooter>
    <PromptInputTools>
      {/* 工具按钮，如模型选择器、附件等 */}
    </PromptInputTools>
    <PromptInputSubmit disabled={!input.trim()} />
  </PromptInputFooter>
</PromptInput>
```

**Props:**
- `value`: 输入值
- `onValueChange`: 输入变化回调
- `onSubmit`: 提交回调
- `isLoading`: 加载状态

### 4. ModelSelector (模型选择器)

模型切换下拉组件。

```tsx
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorItem,
} from "@/components/ai-elements/model-selector";

<ModelSelector value={model} onValueChange={setModel}>
  <ModelSelectorTrigger />
  <ModelSelectorContent>
    <ModelSelectorGroup label="OpenAI">
      <ModelSelectorItem value="gpt-4o">GPT-4o</ModelSelectorItem>
      <ModelSelectorItem value="gpt-4o-mini">GPT-4o Mini</ModelSelectorItem>
    </ModelSelectorGroup>
    <ModelSelectorGroup label="Anthropic">
      <ModelSelectorItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</ModelSelectorItem>
    </ModelSelectorGroup>
  </ModelSelectorContent>
</ModelSelector>
```

### 5. CodeBlock (代码块)

带语法高亮和复制功能的代码展示组件。

```tsx
import { CodeBlock } from "@/components/ai-elements/code-block";

<CodeBlock language="typescript" code={codeString} />
```

---

## 完整 Chatbot 示例

### 前端页面 (page.tsx)

```tsx
"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { Conversation } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorItem,
} from "@/components/ai-elements/model-selector";

export default function ChatPage() {
  const [model, setModel] = useState("gpt-4o-mini");
  
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { model },
  });

  return (
    <div className="flex h-screen flex-col">
      {/* 消息列表 */}
      <div className="flex-1 overflow-auto p-4">
        <Conversation>
          {messages.map((message) => (
            <Message key={message.id} role={message.role}>
              <MessageContent>{message.content}</MessageContent>
            </Message>
          ))}
        </Conversation>
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <PromptInput
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
        >
          <PromptInputTextarea placeholder="输入消息..." />
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelector value={model} onValueChange={setModel}>
                <ModelSelectorTrigger />
                <ModelSelectorContent>
                  <ModelSelectorGroup label="模型">
                    <ModelSelectorItem value="gpt-4o">GPT-4o</ModelSelectorItem>
                    <ModelSelectorItem value="gpt-4o-mini">GPT-4o Mini</ModelSelectorItem>
                    <ModelSelectorItem value="claude-3-5-sonnet">Claude 3.5</ModelSelectorItem>
                  </ModelSelectorGroup>
                </ModelSelectorContent>
              </ModelSelector>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input.trim() || isLoading} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
```

### 后端 API (route.ts)

```typescript
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// 使用 V-API 镜像站 (参考 v-api-docs.md)
const openai = createOpenAI({
  baseURL: "https://api.v-api.ai/v1",
  apiKey: process.env.VAPI_API_KEY,
});

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: openai(model),
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

## 样式定制

组件安装后位于 `@/components/ai-elements/` 目录，可直接修改：

```tsx
// 修改 message.tsx 中的样式
<div
  className={cn(
    "flex flex-col gap-2 text-sm text-foreground",
    // 自定义用户消息样式
    "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
    "group-[.is-user]:px-4 group-[.is-user]:py-3",
    className
  )}
  {...props}
>
  {children}
</div>
```

所有组件接受标准 HTML 属性，支持 `className` 覆盖样式。

---

## 与现有项目集成

本项目 Playground 模块改造时：

1. **保留现有 API 结构**: `/api/playground/chat/route.ts`
2. **替换前端组件**: 使用 AI Elements 组件替换自定义组件
3. **V-API 集成**: 继续使用 `src/lib/playground/vapi.ts` 中的配置
4. **样式适配**: 根据项目主题调整组件样式

---

## 常见问题

### 组件未找到
确保已运行安装命令，组件会被添加到 `components/ai-elements/` 目录。

### TypeScript 类型错误
确保 `tsconfig.json` 中配置了路径别名：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 样式不生效
确保 `tailwind.config.ts` 包含组件目录：
```typescript
content: [
  "./components/**/*.{js,ts,jsx,tsx}",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```
