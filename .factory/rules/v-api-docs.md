---
description: V-API 第三方大模型镜像站接入文档
globs: 
alwaysApply: false
---

# V-API

## 项目配置

### 环境变量
```env
VAPI_API_KEY=your-api-key
VAPI_BASE_URL=https://api.v-api.ai/v1
```

### 默认模型
本项目使用 `glm-4-flash` 作为默认模型，用于：
- 对话翻译
- 意图分类
- Playground 对话

### 代码示例
```typescript
import { createOpenAI } from "@ai-sdk/openai";

const vapi = createOpenAI({
  baseURL: process.env.VAPI_BASE_URL,
  apiKey: process.env.VAPI_API_KEY,
});

// 使用
const model = vapi("glm-4-flash");
```

---

## Docs
- [前言-模型兼容性（必读）](https://api-gpt-ge.apifox.cn/5069242m0.md): 
- [OpenAI官方SDK使用教程](https://api-gpt-ge.apifox.cn/5071665m0.md): 
- [高并发批量请求示例](https://api-gpt-ge.apifox.cn/5544907m0.md): 
- [Claude Code最佳配置教程指南](https://api-gpt-ge.apifox.cn/7009817m0.md): 
- [OpenAi Codex最佳配置教程指南](https://api-gpt-ge.apifox.cn/7738964m0.md): 
- 图片生成（image） > MidJourney [提交模式与状态码说明](https://api-gpt-ge.apifox.cn/5073122m0.md): 
- 图片生成（image） > Gemini [nano-banana参考尺寸](https://api-gpt-ge.apifox.cn/7725435m0.md): 
- 图片生成（image） > Ideogram [README](https://api-gpt-ge.apifox.cn/5390420m0.md): 
- 图片生成（image） > 可灵AI [README](https://api-gpt-ge.apifox.cn/6579931m0.md): 
- 视频模型（Video） [视频模型说明](https://api-gpt-ge.apifox.cn/5225294m0.md): 
- 视频模型（Video） > 快手可灵AI [Callback 协议](https://api-gpt-ge.apifox.cn/5501381m0.md): 
- 视频模型（Video） > vidu视频 [模板生视频template参数](https://api-gpt-ge.apifox.cn/6462855m0.md): 
- 视频模型（Video） [runway 官方API](https://api-gpt-ge.apifox.cn/46286628f0.md): 
- 视频模型（Video） > 数字人 [必读指南](https://api-gpt-ge.apifox.cn/5885135m0.md): 
- 音频模型（Audio） [Realtime (实时语音对话）](https://api-gpt-ge.apifox.cn/5430339m0.md): 
- 音乐创作（suno） [接口介绍](https://api-gpt-ge.apifox.cn/5177896m0.md): 
- 图片处理（pic） [特别说明](https://api-gpt-ge.apifox.cn/6299984m0.md): 

## API Docs
- 模型信息 [列出可用模型](https://api-gpt-ge.apifox.cn/220081913e0.md): 列出当前令牌KEY所支持的模型列表，不同分组的令牌可调用模型不同。如果令牌开启了“自动分组” 则将会展示所选分组以外的模型。
- 模型信息 [列出单个模型](https://api-gpt-ge.apifox.cn/381327502e0.md): 列出当前令牌KEY所支持的模型列表。
- 聊天模型（Chat） [聊天接口（通用）](https://api-gpt-ge.apifox.cn/210153849e0.md): 只提供简单的请求示例，更详细的API接口使用说明 [请阅读官方文档](https://platform.openai.com/docs/api-reference/chat)
- 聊天模型（Chat） [聊天接口（图片分析）](https://api-gpt-ge.apifox.cn/215473722e0.md): 
- 聊天模型（Chat） [聊天接口（函数调用）](https://api-gpt-ge.apifox.cn/257673827e0.md): 
- 聊天模型（Chat） [聊天接口（o1-o3系列模型）](https://api-gpt-ge.apifox.cn/215439574e0.md): :::tip o1系列模型官方暂不支持流式输出
- 聊天模型（Chat） [gpt-4o-all 文件分析](https://api-gpt-ge.apifox.cn/210332388e0.md): `gpt-4o-all` 支持图片分析、文件分析、联网等功能（内核基于gpt-4o模型）
- 聊天模型（Chat） [gpt-4-all 文件分析](https://api-gpt-ge.apifox.cn/210324547e0.md): `gpt-4-all` 支持图片分析、文件分析、联网等功能（内核基于gpt-4模型）
- 聊天模型（Chat） [聊天补全](https://api-gpt-ge.apifox.cn/210518190e0.md): 
- 聊天模型（Chat） [Claude (OpenAI格式)-可PDF分析](https://api-gpt-ge.apifox.cn/210337178e0.md): :::tip
- 聊天模型（Chat） [Claude (原生格式)-可PDF分析](https://api-gpt-ge.apifox.cn/227164659e0.md): :::tip
- 聊天模型（Chat） [Gemini (OpenAI格式)-可文件分析](https://api-gpt-ge.apifox.cn/210339408e0.md): ### 文件分析支持的文件类型
- 聊天模型（Chat） [Gemini (原生格式)-可文件分析](https://api-gpt-ge.apifox.cn/381349186e0.md): :::tip
- 聊天模型（Chat） [GPTs](https://api-gpt-ge.apifox.cn/210340050e0.md): 可调用OpenAI官网所有GPTs，查看 [GPTs合集](https://www.gptshunter.com/) 
- 内容审查 [文本审查](https://api-gpt-ge.apifox.cn/283312580e0.md): :::tip
- 内容审查 [图片审查](https://api-gpt-ge.apifox.cn/283312991e0.md): :::tip
- 向量嵌入 [创建嵌入](https://api-gpt-ge.apifox.cn/210513104e0.md): 
- 文本排序 [文本排序](https://api-gpt-ge.apifox.cn/314317726e0.md): :::tip
- 图片生成（image） > MidJourney [任务：文生图、文图生图 Imagine](https://api-gpt-ge.apifox.cn/210528806e0.md): 一次生成一张4种风格形态的图片。可基于该图片进行后续的其他任务执行/：例如 放大、局部重绘……
- 图片生成（image） > MidJourney [任务：图片编辑、局部重绘](https://api-gpt-ge.apifox.cn/317985101e0.md): 上传或传入一张图片地址，通过提示词进行重新绘制……
- 图片生成（image） > MidJourney [任务：图生视频](https://api-gpt-ge.apifox.cn/317985127e0.md): 上传或传入一张图片地址，通过提示词进行重新绘制……
- 图片生成（image） > MidJourney [任务：换脸 swap_face](https://api-gpt-ge.apifox.cn/210521830e0.md): 提供两张图片进行融合换脸。
- 图片生成（image） > MidJourney [任务：绘图变化](https://api-gpt-ge.apifox.cn/210524224e0.md): 绘图变化 (UPSCALE; VARIATION; REROLL)
- 图片生成（image） > MidJourney [任务：绘图变化-simple](https://api-gpt-ge.apifox.cn/210527599e0.md): 绘图变化-simple(UPSCALE; VARIATION; REROLL)
- 图片生成（image） > MidJourney [任务：执行动作](https://api-gpt-ge.apifox.cn/210526178e0.md): 执行动作 (所有的关联按钮动作UPSCALE; VARIATION; REROLL; ZOOM等)
- 图片生成（image） > MidJourney [任务：图生图 Blend](https://api-gpt-ge.apifox.cn/210527940e0.md): 
- 图片生成（image） > MidJourney [任务：图生文 Describe](https://api-gpt-ge.apifox.cn/210528579e0.md): 图生文：由图片生成文字描述。
- 图片生成（image） > MidJourney [任务：局部重绘 Modal](https://api-gpt-ge.apifox.cn/210529755e0.md): 提交Modal(提交局部重绘、ZOOM)
- 图片生成（image） > MidJourney [任务：提示词缩短 Shorten](https://api-gpt-ge.apifox.cn/210530224e0.md): 一次生成一张4种风格形态的图片。可基于该图片进行后续的其他任务执行。
- 图片生成（image） > MidJourney [查询：根据ID列表查任务](https://api-gpt-ge.apifox.cn/210530959e0.md): 
- 图片生成（image） > MidJourney [查询：根据ID查询任务](https://api-gpt-ge.apifox.cn/210531426e0.md): 
- 图片生成（image） > MidJourney [查询：根据ID获取图片](https://api-gpt-ge.apifox.cn/210531661e0.md): 
- 图片生成（image） > MidJourney [查询：根据ID获取图片 Seed](https://api-gpt-ge.apifox.cn/210531797e0.md): 
- 图片生成（image） > MidJourney [上传：上传图片到Discord](https://api-gpt-ge.apifox.cn/210591969e0.md): 一次生成一张4种风格形态的图片。可基于该图片进行后续的其他任务执行。
- 图片生成（image） > OpenAi [图像生成 dall-e-2、dall-e-3 ](https://api-gpt-ge.apifox.cn/210432242e0.md): 
- 图片生成（image） > OpenAi [图像生成 gpt-image](https://api-gpt-ge.apifox.cn/288964677e0.md): 
- 图片生成（image） > OpenAi [图像编辑 gpt-image](https://api-gpt-ge.apifox.cn/210463340e0.md): :::tip
- 图片生成（image） > Gemini [对话生图/编辑 nano-banana](https://api-gpt-ge.apifox.cn/343275495e0.md): :::tip
- 图片生成（image） > Gemini [图像生成 nano-banana](https://api-gpt-ge.apifox.cn/345881374e0.md): :::tip
- 图片生成（image） > Gemini [图像编辑 nano-banana](https://api-gpt-ge.apifox.cn/345967870e0.md): :::tip
- 图片生成（image） > Gemini [图像生成 imagen 3~4](https://api-gpt-ge.apifox.cn/343275498e0.md): 
- 图片生成（image） > Flux [Flux-图片生成](https://api-gpt-ge.apifox.cn/227858580e0.md): 该请求格式与OpenAI的dall-e模型请求格式一致：
- 图片生成（image） > Flux [Flux-图片编辑](https://api-gpt-ge.apifox.cn/321083223e0.md): :::tip
- 图片生成（image） > 即梦AI [即梦4.0-图片生成](https://api-gpt-ge.apifox.cn/347900548e0.md): 
- 图片生成（image） > 即梦AI [既梦4.0-图片编辑](https://api-gpt-ge.apifox.cn/347899329e0.md): :::tip
- 图片生成（image） > 即梦AI [即梦3.0-图片生成](https://api-gpt-ge.apifox.cn/301187801e0.md): 
- 图片生成（image） > 即梦AI [既梦3.0-图片编辑](https://api-gpt-ge.apifox.cn/347347567e0.md): :::tip
- 图片生成（image） > 即梦AI [即梦AI 生图-旧版](https://api-gpt-ge.apifox.cn/291555110e0.md): ### 业务错误码
- 图片生成（image） > Qwen [图像生成](https://api-gpt-ge.apifox.cn/346745674e0.md): :::tip
- 图片生成（image） > Qwen [图像编辑](https://api-gpt-ge.apifox.cn/346745675e0.md): :::tip
- 图片生成（image） > Grok [图像生成](https://api-gpt-ge.apifox.cn/282256875e0.md): grok的图片生成接口与dalle 基本一致，区别是支持的参数更少。
- 图片生成（image） > Ideogram [Generate 3.0 (文生图)](https://api-gpt-ge.apifox.cn/328207681e0.md): - 请求参数请查阅官方文档  https://developer.ideogram.ai/api-reference/api-reference/generate-v3
- 图片生成（image） > Ideogram [Edit 3.0 (编辑)](https://api-gpt-ge.apifox.cn/328315508e0.md): - 请求参数请查阅官方文档  https://developer.ideogram.ai/api-reference/api-reference/edit-v3
- 图片生成（image） > Ideogram [Remix 3.0 (混合图)](https://api-gpt-ge.apifox.cn/328316799e0.md): - 请求参数请查阅官方文档 https://developer.ideogram.ai/api-reference/api-reference/remix-v3
- 图片生成（image） > Ideogram [Reframe 3.0 (重构) ](https://api-gpt-ge.apifox.cn/328317232e0.md): - 请求参数请查阅官方文档 https://developer.ideogram.ai/api-reference/api-reference/reframe-v3
- 图片生成（image） > Ideogram [Replace bg 3.0 (背景替换)](https://api-gpt-ge.apifox.cn/328318497e0.md): - 请求参数请查阅官方文档 https://developer.ideogram.ai/api-reference/api-reference/replace-background-v3
- 图片生成（image） > Ideogram [Generate (文生图)](https://api-gpt-ge.apifox.cn/228560685e0.md): - 参考 [官方文档](https://developer.ideogram.ai/api-reference/api-reference/generate)
- 图片生成（image） > Ideogram [Remix（混合图）](https://api-gpt-ge.apifox.cn/228560740e0.md): 
- 图片生成（image） > Ideogram [Upscale（高清放大） ](https://api-gpt-ge.apifox.cn/228562124e0.md): 
- 图片生成（image） > Ideogram [Describe（图生描述）](https://api-gpt-ge.apifox.cn/228562123e0.md): 
- 图片生成（image） > stable-diffusion [stable-diffusion (chat格式)](https://api-gpt-ge.apifox.cn/210505814e0.md): 
- 图片生成（image） > stable-diffusion [stable-diffusion (dalle格式)](https://api-gpt-ge.apifox.cn/257870178e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：图像生成](https://api-gpt-ge.apifox.cn/218861667e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：虚拟试穿](https://api-gpt-ge.apifox.cn/231904197e0.md): 该接口可以完美的更换人物服饰，上传一张模态人物图，再上传一张服饰图 即可一键换装。
- 视频模型（Video） > 快手可灵AI [任务：文生视频](https://api-gpt-ge.apifox.cn/218907798e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：图生视频](https://api-gpt-ge.apifox.cn/218920495e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：多图生视频](https://api-gpt-ge.apifox.cn/311675901e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：视频延长](https://api-gpt-ge.apifox.cn/251323997e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：视频配音-对口型](https://api-gpt-ge.apifox.cn/251325644e0.md): 查看示例：（示例有效期30天-如无法查看说明已过期）
- 视频模型（Video） > 快手可灵AI [任务：视频特效-单图](https://api-gpt-ge.apifox.cn/285197745e0.md): 
- 视频模型（Video） > 快手可灵AI [任务：视频特效-双人互动](https://api-gpt-ge.apifox.cn/285198109e0.md): 
- 视频模型（Video） > 快手可灵AI [查询：任务结果(本站通用)](https://api-gpt-ge.apifox.cn/353815565e0.md): 
- 视频模型（Video） > 快手可灵AI [查询：任务结果(官方格式)](https://api-gpt-ge.apifox.cn/218766625e0.md): 对已经提交的任务进行查询状态：开发功能时可进行轮询查询，直到返回成功状态。
- 视频模型（Video） > vidu视频 [任务：模板生视频(推荐)](https://api-gpt-ge.apifox.cn/284017138e0.md): :::tip
- 视频模型（Video） > vidu视频 [任务：文生视频](https://api-gpt-ge.apifox.cn/283719625e0.md): 
- 视频模型（Video） > vidu视频 [任务：图生视频](https://api-gpt-ge.apifox.cn/284008277e0.md): 
- 视频模型（Video） > vidu视频 [任务：参考生视频](https://api-gpt-ge.apifox.cn/284009817e0.md): 
- 视频模型（Video） > vidu视频 [任务：首尾帧视频](https://api-gpt-ge.apifox.cn/284014753e0.md): 
- 视频模型（Video） > vidu视频 [查询：任务结果](https://api-gpt-ge.apifox.cn/284020272e0.md): 
- 视频模型（Video） > 豆包视频 [任务：视频生成](https://api-gpt-ge.apifox.cn/286337873e0.md): 
- 视频模型（Video） > 豆包视频 [查询：任务结果](https://api-gpt-ge.apifox.cn/316212001e0.md): 
- 视频模型（Video） > 即梦AI [任务：图生视频](https://api-gpt-ge.apifox.cn/291565987e0.md): :::tip
- 视频模型（Video） > 即梦AI [任务：文生视频](https://api-gpt-ge.apifox.cn/291557798e0.md): :::tip
- 视频模型（Video） > 即梦AI [查询：任务结果](https://api-gpt-ge.apifox.cn/291572311e0.md): 
- 视频模型（Video） > 海螺视频 [文生视频](https://api-gpt-ge.apifox.cn/352441157e0.md): :::tip
- 视频模型（Video） > 海螺视频 [图生视频](https://api-gpt-ge.apifox.cn/352531231e0.md): :::tip
- 视频模型（Video） > 海螺视频 [图生首尾帧视频](https://api-gpt-ge.apifox.cn/352531443e0.md): :::tip
- 视频模型（Video） > 海螺视频 [主体参考生视频](https://api-gpt-ge.apifox.cn/352531457e0.md): :::tip
- 视频模型（Video） > 海螺视频 [查询：任务结果](https://api-gpt-ge.apifox.cn/352515423e0.md): 
- 视频模型（Video） > 海螺视频 [下载：视频地址](https://api-gpt-ge.apifox.cn/352528040e0.md): 
- 视频模型（Video） > pika视频 [任务：生成视频](https://api-gpt-ge.apifox.cn/235381247e0.md): 
- 视频模型（Video） > pika视频 [查询：任务结果](https://api-gpt-ge.apifox.cn/235382643e0.md): 
- 视频模型（Video） > luma视频 [任务：生成视频](https://api-gpt-ge.apifox.cn/220081974e0.md): 
- 视频模型（Video） > luma视频 [任务：拓展视频](https://api-gpt-ge.apifox.cn/220082139e0.md): 
- 视频模型（Video） > luma视频 [查询：单个任务](https://api-gpt-ge.apifox.cn/220082524e0.md): 
- 视频模型（Video） > luma视频 [查询：批量查询任务](https://api-gpt-ge.apifox.cn/220082540e0.md): 
- 视频模型（Video） > luma视频 [获取：无水印视频](https://api-gpt-ge.apifox.cn/220082159e0.md): :::tip
- 视频模型（Video） > runway 官方API [任务：生成视频](https://api-gpt-ge.apifox.cn/239445747e0.md): 可查阅 runway [官方API文档](https://docs.dev.runwayml.com/api/)
- 视频模型（Video） > runway 官方API [查询：单个任务](https://api-gpt-ge.apifox.cn/239445750e0.md): 可查阅 runway [官方API文档](https://docs.dev.runwayml.com/api/)
- 视频模型（Video） > runway 旧版API-暂时失效 [任务：生成视频.gen2](https://api-gpt-ge.apifox.cn/220081984e0.md): 
- 视频模型（Video） > runway 旧版API-暂时失效 [任务：生成视频.gen3](https://api-gpt-ge.apifox.cn/220082591e0.md): 
- 视频模型（Video） > runway 旧版API-暂时失效 [任务：拓展视频](https://api-gpt-ge.apifox.cn/220082969e0.md): 
- 视频模型（Video） > runway 旧版API-暂时失效 [查询：单个任务](https://api-gpt-ge.apifox.cn/220089745e0.md): :::tip
- 视频模型（Video） > runway 旧版API-暂时失效 [上传：参考图 A认证](https://api-gpt-ge.apifox.cn/220089756e0.md): :::caution 注意-上传的图片有时效性
- 视频模型（Video） > runway 旧版API-暂时失效 [上传：参考图 C 获取](https://api-gpt-ge.apifox.cn/220089760e0.md): :::caution 注意-上传的图片有时效性
- 视频模型（Video） > 数字人 [任务：生成数字人视频](https://api-gpt-ge.apifox.cn/257172825e0.md): 
- 视频模型（Video） > 数字人 [查询：任务结果](https://api-gpt-ge.apifox.cn/257172845e0.md): 
- 视频模型（Video） > 数字人 [获取：默认voice 列表](https://api-gpt-ge.apifox.cn/257206683e0.md): 如果没有现成的声音文件或不想录制声音，可以通过该接口获取默认的voice列表来使用。
- 视频模型（Video） > sora视频 [文生视频](https://api-gpt-ge.apifox.cn/358217161e0.md): 
- 视频模型（Video） > sora视频 [图生视频](https://api-gpt-ge.apifox.cn/362049312e0.md): :::tip
- 视频模型（Video） > sora视频 [视频生视频](https://api-gpt-ge.apifox.cn/362173997e0.md): :::tip
- 视频模型（Video） > sora视频 [查询视频状态](https://api-gpt-ge.apifox.cn/361878587e0.md): 
- 视频模型（Video） > sora视频 [获取视频地址](https://api-gpt-ge.apifox.cn/361881278e0.md): 
- 视频模型（Video） > 阿里百炼 [文生视频](https://api-gpt-ge.apifox.cn/366696818e0.md): :::tip
- 视频模型（Video） > 阿里百炼 [图生视频-首帧](https://api-gpt-ge.apifox.cn/366697193e0.md): :::tip
- 视频模型（Video） > 阿里百炼 [查询：任务结果](https://api-gpt-ge.apifox.cn/366696915e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 OpenAI TTS-1](https://api-gpt-ge.apifox.cn/210472139e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 Gemini TTS系列](https://api-gpt-ge.apifox.cn/315116562e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 Qwen TTS系列](https://api-gpt-ge.apifox.cn/356760467e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 ChatTTS](https://api-gpt-ge.apifox.cn/257854976e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 fish-speech-1.5](https://api-gpt-ge.apifox.cn/257864344e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 fish-speech-1.2-sft](https://api-gpt-ge.apifox.cn/283201288e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 MegaTTS3](https://api-gpt-ge.apifox.cn/283201760e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 Step-Audio-TTS-3B](https://api-gpt-ge.apifox.cn/283205009e0.md): 
- 音频模型（Audio） > 文字转语音TTS [模型 FunAudioLLM-CosyVoice-300M](https://api-gpt-ge.apifox.cn/283205532e0.md): 
- 音频模型（Audio） > 语音转文字 whisper [模型 whisper-1](https://api-gpt-ge.apifox.cn/210480397e0.md): 更新详细的用法可参考 [官方API文档](https://platform.openai.com/docs/guides/speech-to-text)
- 音频模型（Audio） > 语音转文字 whisper [模型 whisper-base](https://api-gpt-ge.apifox.cn/283207814e0.md): 由 Open AI 开发并开源自动语音识别（ASR）模型。能够很好地处理各种语言、口音和背景噪音。相较于 Large 版，Base 版处理速度更快，具有较少的参数。
- 音频模型（Audio） > 语音转文字 whisper [模型 whisper-large](https://api-gpt-ge.apifox.cn/283208862e0.md): 由 Open AI 开发并开源自动语音识别（ASR）模型。Whisper 由 68 万小时的多语言数据训练，其能够很好地处理各种语言、口音和背景噪音。
- 音频模型（Audio） > 语音转文字 whisper [模型 whisper-large-v3](https://api-gpt-ge.apifox.cn/283209267e0.md): Whisper-large-v3 是一个高精度、多语种的语音识别模型，适用于实时语音转录和语音交互应用。
- 音频模型（Audio） > 语音转文字 whisper [模型 whisper-large-v3-turbo](https://api-gpt-ge.apifox.cn/283206615e0.md): whisper-large-v3-turbo 是一款高效的语音识别模型，具备快速、精准的语音转文本能力，支持多语言识别，并在低延迟和高准确度之间提供了优秀的平衡，特别适合实时语音处理和大规模应用场景。
- 音频模型（Audio） > 语音转文字 whisper [创建翻译](https://api-gpt-ge.apifox.cn/210515153e0.md): 
- 音频模型（Audio） > 语音转文字 whisper [模型 SenseVoiceSmall](https://api-gpt-ge.apifox.cn/283209485e0.md): Whisper-large-v3 是一个高精度、多语种的语音识别模型，适用于实时语音转录和语音交互应用。
- 音乐创作（suno） [聊天方式：生成歌曲](https://api-gpt-ge.apifox.cn/217243986e0.md): 只提供简单的请求示例，更详细的API接口使用说明 [请阅读官方文档](https://platform.openai.com/docs/api-reference/chat)
- 音乐创作（suno） [任务：生成歌曲](https://api-gpt-ge.apifox.cn/217243106e0.md): 总三种创作方式
- 音乐创作（suno） [任务：生成歌词](https://api-gpt-ge.apifox.cn/217243569e0.md): 
- 音乐创作（suno） [查询：批量查询任务](https://api-gpt-ge.apifox.cn/217243576e0.md): 
- 音乐创作（suno） [查询：单个任务](https://api-gpt-ge.apifox.cn/217243960e0.md): 
- 图片处理（pic） [任务：智能抠图](https://api-gpt-ge.apifox.cn/275019438e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：图片清晰化(无损放大)](https://api-gpt-ge.apifox.cn/275022044e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：图片添加背景](https://api-gpt-ge.apifox.cn/275024169e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：去水印-自动](https://api-gpt-ge.apifox.cn/294245441e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：去水印](https://api-gpt-ge.apifox.cn/275024162e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：OCR服务](https://api-gpt-ge.apifox.cn/294255445e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：证件照](https://api-gpt-ge.apifox.cn/275024170e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [任务：照片上色](https://api-gpt-ge.apifox.cn/294254803e0.md): 注意：请使用formData方式发送请求
- 图片处理（pic） [查询：任务结果](https://api-gpt-ge.apifox.cn/275020944e0.md): :::tip
- 文档处理（pdf、ocr） [OCR识别](https://api-gpt-ge.apifox.cn/283384464e0.md): 注意：请使用formData方式发送请求。
- 文档处理（pdf、ocr） [任务：PDF解析](https://api-gpt-ge.apifox.cn/283418247e0.md): 解析PDF内容并返回，请使用FormData方式请求！
- 文档处理（pdf、ocr） [查询：PDF解析结果](https://api-gpt-ge.apifox.cn/283418248e0.md): 
- 3D模型 [任务：图片转3D模型](https://api-gpt-ge.apifox.cn/283324667e0.md): :::tip
- 3D模型 [查询：任务结果](https://api-gpt-ge.apifox.cn/283376526e0.md): 
- [查询令牌用量](https://api-gpt-ge.apifox.cn/253589607e0.md): 查询该令牌总使用量
- [查询令牌限额](https://api-gpt-ge.apifox.cn/253589207e0.md): 通过该接口查询令牌key的授权额度（限额），如果令牌设置为 `无限额度` 则查询结果是100000000
- [查询账户信息](https://api-gpt-ge.apifox.cn/303002012e0.md): 通过该接口查询账户的具体信息。
