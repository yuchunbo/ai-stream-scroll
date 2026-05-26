# AI Stream Scroll

AI 流式输出 + 智能随读滚动插件

## 解决痛点
现有 AI 流式输出强制底部滚动，新文字上顶打乱阅读视线，用户频繁手动暂停，长文精读体验极差。

本插件可实现预加载后置渲染 + 基准匀速自动滚 + 用户行为个性化调速 + 手动即时接管，做到千人千面沉浸式阅读，兼顾自动省心与手动自由。

## ✨ 核心特性

- **📝 流式输出模拟**：模拟大模型逐句/逐词/逐字输出，支持长文本
- **🎯 智能滚动**：内容达到可视区域 80% 时自动平滑滚动
- **⚡ 行为调速**：根据用户阅读行为自动调整滚动速度
- **💾 本地缓存**：自动保存用户阅读速度偏好，跨会话复用
- **🚀 开箱即用**：完整的默认配置，支持全局注册或局部引入

## 📦 安装

```bash
# npm
npm install ai-stream-scroll

# pnpm
pnpm add ai-stream-scroll

# yarn
yarn add ai-stream-scroll
```

## 🚀 快速上手

### 全局注册

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import AiStreamScrollPlugin from 'ai-stream-scroll'
import 'ai-stream-scroll/dist/style.css'

const app = createApp(App)

// 全局注册
app.use(AiStreamScrollPlugin, {
  baseSpeed: 400,
  enableLocalCache: true
})

app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <AiStreamScroll 
    height="500px"
    :auto-start="false"
  />
</template>
```

### 局部引入

```vue
<template>
  <AiStreamScroll 
    :height="400px"
    :initial-text="myText"
    :mock-speed="50"
  />
</template>

<script setup lang="ts">
import { AiStreamScroll } from 'ai-stream-scroll'
import 'ai-stream-scroll/dist/style.css'

const myText = '这是一段要流式输出的文本...'
</script>
```

## 📋 Props 配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `initialText` | `string` | `''` | 初始文本内容，为空时使用内置 Mock 数据 |
| `mockSpeed` | `number` | `40` | 流式输出间隔（毫秒），越小越快 |
| `autoStart` | `boolean` | `false` | 是否自动开始输出 |
| `triggerPercent` | `number` | `80` | 滚动触发阈值（0-100），内容高度达到视口百分比时启动自动滚动 |
| `baseSpeed` | `number` | `400` | 基准滚动速度（字/分钟） |
| `enableBehaviorAdjust` | `boolean` | `true` | 是否启用行为调速 |
| `speedMin` | `number` | `100` | 最小滚动速度（字/分钟） |
| `speedMax` | `number` | `1200` | 最大滚动速度（字/分钟） |
| `enableLocalCache` | `boolean` | `true` | 是否启用本地缓存 |
| `cacheKey` | `string` | `'ai-stream-scroll-speed'` | 缓存键名，用于隔离不同用户配置 |
| `height` | `string` | `'400px'` | 组件高度 |
| `placeholder` | `string` | `'准备就绪...'` | 初始占位文本 |
| `showControl` | `boolean` | `true` | 是否显示控制面板 |
| `paragraphPauseDuration` | `number` | `400` | 段落/换行暂停时长（毫秒） |
| `topPadding` | `number` | `20` | 顶部留白（像素） |

## 🎯 事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| `start` | 开始输出时触发 | - |
| `pause` | 暂停输出时触发 | - |
| `reset` | 重置时触发 | - |
| `scroll` | 滚动状态变化时触发 | `{ isAutoScrolling, isInterrupted, isAtBottom }` |
| `speed-change` | 速度变化时触发 | `currentSpeed: number` |

## 📡 实例方法

通过 `ref` 调用：

```vue
<template>
  <AiStreamScroll ref="streamRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AiStreamScroll } from 'ai-stream-scroll'

const streamRef = ref<InstanceType<typeof AiStreamScroll> | null>(null)

// 开始输出
streamRef.value?.start()

// 暂停输出
streamRef.value?.pause()

// 重置
streamRef.value?.reset()

// 滚动到底部
streamRef.value?.scrollToBottom()

// 切换智能滚动
streamRef.value?.toggleSmartScroll()
</script>
```

## 🧠 行为调速规则

插件会自动分析用户阅读行为并调整滚动速度：

- **精读行为**（选中文字、复制、长时间停留）：滚动速度下调 5%/次
- **快速浏览**（频繁向下滚动追更）：滚动速度上调 5%/次
- **上下限保护**：速度被限制在 `speedMin` 和 `speedMax` 之间
- **手动设置优先**：用户手动调整速度后，行为分析不会覆盖

## 💾 本地缓存

- 使用 `localStorage` 存储用户专属滚动速率
- 按 `cacheKey` 隔离不同场景/用户的配置
- 跨会话自动复用，刷新页面后保持用户偏好

## 🌐 浏览器兼容性

- Chrome（推荐）
- Firefox
- Safari
- Edge

## 🛠️ 开发与构建

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 运行示例
pnpm dev:example
```

## 📁 项目结构

```
ai-stream-scroll/
├── src/
│   ├── components/
│   │   └── AiStreamScroll.vue    # 核心组件
│   ├── utils/
│   │   ├── mockStream.ts         # 流式输出模拟
│   │   ├── scrollHelper.ts       # 智能滚动逻辑
│   │   ├── speedController.ts    # 速度控制器
│   │   └── behaviorTracker.ts    # 行为追踪器
│   ├── types/
│   │   └── index.ts              # 类型定义
│   ├── styles/
│   │   └── index.css             # 全局样式
│   └── index.ts                  # 插件入口
├── examples/                      # 示例代码
├── README.md
└── package.json
```

## 📄 License

MIT License
