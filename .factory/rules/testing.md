---
description: 测试编写规范
globs: "**/*.test.{ts,tsx}"
alwaysApply: false
---

# 测试规范

## 文件组织

### 测试文件位置
**Applies to**: 所有单元测试和组件测试
**Rule**: 测试文件与源文件放在同一目录
**Example**: 
```
src/components/
├── UserCard.tsx
└── UserCard.test.tsx
```

### E2E 测试位置
**Applies to**: 端到端测试
**Rule**: E2E 测试统一放在项目根目录的 `e2e/` 目录

## 命名规范

### 测试用例命名
**Applies to**: 所有测试用例
**Rule**: 使用 "should [action] when [condition]" 格式
**Example**:
```typescript
// ✅ 正确
it('should display error message when login fails', () => {});
it('should redirect to dashboard when login succeeds', () => {});

// ❌ 避免
it('login error', () => {});
it('works', () => {});
```

## 测试结构

### 单一断言原则
**Applies to**: 单元测试
**Rule**: 每个测试用例测试一个行为，可以有多个断言但需测试同一行为
**Example**:
```typescript
// ✅ 正确 - 测试同一行为的多个方面
it('should return complete user object', () => {
  const user = createUser('John');
  expect(user.id).toBeDefined();
  expect(user.name).toBe('John');
  expect(user.createdAt).toBeInstanceOf(Date);
});

// ❌ 避免 - 测试多个不同行为
it('should handle user operations', () => {
  expect(createUser('John').name).toBe('John');
  expect(deleteUser('123')).toBe(true);
  expect(listUsers()).toHaveLength(0);
});
```

## Mock 规范

### 边界 Mock
**Applies to**: 所有需要 Mock 的测试
**Rule**: 只 Mock 外部 API 和服务，不 Mock 内部函数
**Example**:
```typescript
// ✅ 正确 - Mock 外部 API
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'John' }),
}));

// ❌ 避免 - Mock 内部实现
vi.mock('@/utils/formatName', () => ({
  formatName: vi.fn().mockReturnValue('John'),
}));
```

### API Mock 工具
**Applies to**: 集成测试中的 API Mock
**Rule**: 使用 MSW (Mock Service Worker) 而非直接 Mock fetch
**Example**:
```typescript
import { http, HttpResponse } from 'msw';

const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([{ id: '1', name: 'John' }]);
  }),
];
```

## 测试工具

本项目使用的测试工具：
- **Vitest** - 测试框架
- **React Testing Library** - 组件测试
- **MSW** - API Mock
