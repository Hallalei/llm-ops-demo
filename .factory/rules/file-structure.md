---
description: 文件长度与模块化规范
globs: 
alwaysApply: true
---

# File Length and Modularity Rules

## 文件长度限制

### 300 行代码上限
**Applies to**: 所有源代码文件
**Rule**: 所有源文件必须控制在 300 行代码以内（包括注释和空行）
**Rationale**: 短文件更易于理解、测试和维护

## 模块化原则

### 单一职责
**Applies to**: 所有模块和文件
**Rule**: 每个文件只服务于一个目的（如：注册管理、CLI 解析、工具集成）

### 模块化导出
**Applies to**: 所有导出模块
**Rule**: 将逻辑拆分为小型、可复用的函数或类

### 增长时拆分
**Applies to**: 接近 300 行的文件
**Rule**: 当文件接近 300 行时，重构为子模块
**Example**: 
```
registry/read.ts
registry/write.ts
registry/validate.ts
```

### 关注点分离
**Applies to**: 所有业务逻辑
**Rule**: 文件 I/O、提示逻辑和验证必须放在不同的模块中