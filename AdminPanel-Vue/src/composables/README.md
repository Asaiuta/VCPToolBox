# Composables 使用指南

本目录包含可复用的组合式函数（Composables），遵循 Vue 3 Composition API 最佳实践。

## 目录

- [useRequest](#userequest) - API 请求封装
- [useStatusMessage](#usestatusmessage) - 状态消息管理
- [useLocalStorage](#uselocalstorage) - 本地存储
- [useDebounceFn](#usedebouncefn) - 防抖函数
- [usePagination](#usepagination) - 分页逻辑

---

## useRequest

**文件路径：** `src/composables/useRequest.ts`

**功能：** 统一处理 API 请求、加载状态、错误处理和自动重试。

### API

```typescript
interface UseRequestOptions {
  immediate?: boolean              // 是否立即执行请求
  onSuccess?: (data: any) => void  // 成功回调
  onError?: (error: Error) => void // 错误回调
}

interface UseRequestReturn<T> {
  data: Ref<T | null>              // 响应数据
  isLoading: Ref<boolean>          // 加载状态
  error: Ref<Error | null>         // 错误信息
  execute: (options?: { retry?: boolean }) => Promise<T | null> // 执行请求
  reset: () => void                // 重置状态
}
```

### 使用示例

```typescript
import { useRequest } from '@/composables/useRequest'
import { apiFetch } from '@/utils/api'

// 基本使用 - 手动执行
const { data, isLoading, error, execute } = useRequest(() =>
  apiFetch('/api/users')
)

// 立即执行
const { data } = useRequest(() => apiFetch('/api/users'), { immediate: true })

// 带回调
const { execute } = useRequest(
  () => apiFetch('/api/users'),
  {
    onSuccess: (data) => console.log('获取成功:', data),
    onError: (error) => console.error('获取失败:', error)
  }
)

// 手动执行（带重试）
await execute()           // 默认启用重试（最多 3 次，指数退避）
await execute({ retry: false }) // 不重试
```

### 重试机制

- **默认启用**：请求失败时自动重试
- **重试次数**：最多 3 次
- **退避策略**：指数退避（1s, 2s, 4s）
- **不重试场景**：传入 `{ retry: false }`

---

## useStatusMessage

**文件路径：** `src/composables/useStatusMessage.ts`

**功能：** 统一管理组件内的状态消息显示（成功、错误、提示、信息）。

### API

```typescript
type StatusType = 'info' | 'success' | 'error' | 'notice'

interface UseStatusMessageReturn {
  message: Ref<string>
  type: Ref<StatusType>
  show: (msg: string, t?: StatusType) => void
  clear: () => void
  isSuccess: () => boolean
  isError: () => boolean
  isNotice: () => boolean
  isInfo: () => boolean
}
```

### 使用示例

```typescript
import { useStatusMessage } from '@/composables/useStatusMessage'

const { message, type, show, clear } = useStatusMessage()

// 显示成功消息
show('操作成功！', 'success')

// 显示错误消息
show('操作失败', 'error')

// 显示提示消息
show('请注意数据备份', 'notice')

// 显示信息消息
show('加载中...', 'info')

// 清除消息
clear()

// 检查状态
if (isSuccess()) {
  // 处理成功逻辑
}
```

### 替代模式

**❌ 不推荐：** 在每个组件中重复定义状态消息变量

```typescript
// 避免这种模式
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
```

**✅ 推荐：** 使用 `useStatusMessage`

```typescript
const { message: statusMessage, type: statusType, show, clear } = useStatusMessage()
```

---

## useLocalStorage

**文件路径：** `src/composables/useLocalStorage.ts`

**功能：** 提供响应式的 localStorage 读写能力，自动持久化。

### API

```typescript
interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string    // 自定义序列化函数
  parser?: (value: string) => T        // 自定义解析函数
  listenExternal?: boolean             // 是否监听外部变化（多标签页同步）
  sync?: boolean                       // 是否监听 storage 事件
}
```

### 使用示例

```typescript
import { useLocalStorage } from '@/composables/useLocalStorage'

// 基本使用
const theme = useLocalStorage<'dark' | 'light'>('theme', 'dark')

// 修改值（自动持久化）
theme.value = 'light'

// 使用自定义序列化
const date = useLocalStorage<Date>('lastLogin', new Date(), {
  serializer: (v) => v.toISOString(),
  parser: (v) => new Date(v)
})

// 多标签页同步
const count = useLocalStorage<number>('count', 0, { sync: true })
```

### 辅助函数

以下函数已导出但项目中未使用，可按需使用：

```typescript
import {
  removeLocalStorage,
  removeSessionStorage,
  clearLocalStorage,
  clearSessionStorage
} from '@/composables/useLocalStorage'

// 移除项
removeLocalStorage('theme')

// 清空存储
clearLocalStorage()
```

---

## useDebounceFn

**文件路径：** `src/composables/useDebounceFn.ts`

**功能：** 创建防抖函数，延迟执行直到等待期结束。

### API

```typescript
function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void
```

### 使用示例

```typescript
import { useDebounceFn } from '@/composables/useDebounceFn'

// 搜索输入防抖
const searchFn = useDebounceFn((query: string) => {
  console.log('搜索:', query)
}, 300)

// 触发搜索（300ms 内多次调用只执行最后一次）
searchFn('Vue')
searchFn('Vue3')  // 这次会执行
```

---

## usePagination

**文件路径：** `src/composables/usePagination.ts`

**功能：** 分页逻辑封装，处理页码、页大小、总数计算。

### API

```typescript
interface UsePaginationOptions {
  currentPage?: number    // 当前页码
  pageSize?: number       // 每页条数
  total?: number          // 总条数
}

interface UsePaginationReturn {
  currentPage: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  totalPages: ComputedRef<number>
  hasNextPage: ComputedRef<boolean>
  hasPrevPage: ComputedRef<boolean>
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
  reset: () => void
}
```

### 使用示例

```typescript
import { usePagination } from '@/composables/usePagination'

const {
  currentPage,
  pageSize,
  total,
  totalPages,
  hasNextPage,
  nextPage,
  goToPage
} = usePagination({
  currentPage: 1,
  pageSize: 10,
  total: 100
})

// 下一页
nextPage()

// 跳转到指定页
goToPage(5)

// 设置总数
setTotal(200)
```

---

## 最佳实践

### 1. 命名规范

- Composable 函数名必须以 `use` 开头
- 返回值解构时保持语义清晰

```typescript
// ✅ 好
const { data, isLoading, execute } = useRequest(...)
const { message, show, clear } = useStatusMessage()

// ❌ 避免
const { data: d, isLoading: l } = useRequest(...)
```

### 2. 类型注解

- 为泛型参数提供明确类型
- 返回值使用接口定义

```typescript
// ✅ 好
interface User { id: number; name: string }
const { data } = useRequest<User>(() => apiFetch('/api/user'))

// ❌ 避免
const { data } = useRequest(() => apiFetch('/api/user')) // data 类型为 any
```

### 3. 错误处理

- 使用 `useRequest` 的 `onError` 回调
- 或在 `execute()` 后检查 `error.value`

```typescript
const { data, error, execute } = useRequest(() => apiFetch('/api/data'))

await execute()
if (error.value) {
  console.error('请求失败:', error.value.message)
}
```

### 4. 内存管理

- Composable 内部的副作用会在组件卸载时自动清理
- 手动创建的定时器/监听器需要在 `onUnmounted` 中清理

---

## 已移除的 Composables

以下 Composables 因未使用或功能重复已被移除：

- `useTheme.ts` - 主题管理已由 `appStore` 统一处理
- `usePollingRequest` - 轮询请求未被使用

---

## 更新记录

- **2026-03-28** - 移除 `useTheme` 和 `usePollingRequest`，添加本文档
