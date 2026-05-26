<script setup lang="ts">
/**
 * AI流式输出+智能随读滚动核心组件
 * 支持Mock流式输出、智能滚动、行为调速、本地缓存
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted, defineExpose } from 'vue'
import { createMockStream, mockTexts } from '../utils/mockStream'
import { ScrollHelper } from '../utils/scrollHelper'
import { SpeedController } from '../utils/speedController'
import { BehaviorTracker } from '../utils/behaviorTracker'
import type { PluginOptions, StreamConfig } from '../types'

// Props定义
const props = withDefaults(defineProps<PluginOptions>(), {
  initialText: '',
  mockSpeed: 40,
  autoStart: false,
  triggerPercent: 80,
  baseSpeed: 400,
  enableBehaviorAdjust: true,
  speedMin: 100,
  speedMax: 1200,
  enableLocalCache: true,
  cacheKey: 'ai-stream-scroll-speed',
  height: '400px',
  placeholder: '准备就绪，点击开始按钮开始流式输出...',
  showControl: true,
  paragraphPauseDuration: 400,
  topPadding: 20
})

// 事件定义
const emit = defineEmits<{
  start: []
  pause: []
  reset: []
  scroll: [state: Record<string, unknown>]
  'speed-change': [speed: number]
}>()

// 状态
const outputContainer = ref<HTMLElement | null>(null)
const currentText = ref(props.initialText)
const isRunning = ref(false)
const isPaused = ref(false)
const isCompleted = ref(false)
const progress = ref(0)
const enableSmartScroll = ref(true)

// 模块实例
let streamInstance: ReturnType<typeof createMockStream> | null = null
let scrollHelper: ScrollHelper | null = null
let speedController: SpeedController | null = null
let behaviorTracker: BehaviorTracker | null = null

// 计算属性
const scrollStatus = computed(() => {
  if (!scrollHelper) return '初始化中...'
  
  const state = scrollHelper.getState()
  
  if (!enableSmartScroll.value) {
    return '智能滚动已禁用'
  }
  
  if (state.isInterrupted) {
    return '用户已打断'
  }
  
  if (state.isAutoScrolling) {
    return '自动滚动中'
  }
  
  if (state.isAtBottom) {
    return '已到达底部'
  }
  
  return '等待中'
})

const currentSpeedDisplay = computed(() => {
  if (!speedController) return `${props.baseSpeed} 字/分钟`
  return `${Math.round(speedController.getCurrentSpeed())} 字/分钟`
})

const speedMultiplierDisplay = computed(() => {
  if (!speedController) return 'x1.00'
  return `x${speedController.getMultiplier().toFixed(2)}`
})

const behaviorStats = computed(() => {
  if (!behaviorTracker) return null
  return behaviorTracker.getStats()
})

// 初始化模块
const initModules = () => {
  if (!outputContainer.value) return

  // 创建速度控制器
  speedController = new SpeedController({
    baseSpeed: props.baseSpeed,
    minSpeed: props.speedMin,
    maxSpeed: props.speedMax,
    enableCache: props.enableLocalCache,
    cacheKey: props.cacheKey
  })

  // 创建行为追踪器
  behaviorTracker = new BehaviorTracker()

  // 创建滚动助手
  scrollHelper = new ScrollHelper({
    container: outputContainer.value,
    speedController: speedController,
    behaviorTracker: behaviorTracker,
    triggerPercent: props.triggerPercent,
    topPadding: props.topPadding,
    paragraphPauseDuration: props.paragraphPauseDuration,
    enableSmartScroll: enableSmartScroll.value
  })
}

// 流式输出处理
const handleChunk = (chunk: string) => {
  currentText.value += chunk
  progress.value = streamInstance?.getProgress() ?? 0
  
  nextTick(() => {
    scrollHelper?.handleNewContent()
  })
}

const handleComplete = () => {
  isRunning.value = false
  isCompleted.value = true
  progress.value = 100
  scrollHelper?.stopAutoScroll()
}

const handlePause = () => {
  isPaused.value = true
  scrollHelper?.stopAutoScroll()
  emit('pause')
}

const handleResume = () => {
  isPaused.value = false
  if (enableSmartScroll.value) {
    scrollHelper?.startAutoScroll()
  }
}

// 控制函数
const startStream = () => {
  if (isRunning.value) return

  const text = props.initialText || mockTexts.long

  const config: StreamConfig = {
    speed: props.mockSpeed,
    chunkSize: 'sentence'
  }

  streamInstance = createMockStream(
    text,
    config,
    handleChunk,
    handleComplete,
    handlePause,
    handleResume
  )

  isRunning.value = true
  isPaused.value = false
  isCompleted.value = false
  progress.value = 0
  
  if (enableSmartScroll.value) {
    scrollHelper?.startAutoScroll()
  }
  
  streamInstance.start()
  emit('start')
}

const pauseStream = () => {
  streamInstance?.pause()
}

const resumeStream = () => {
  streamInstance?.resume()
}

const resetStream = () => {
  streamInstance?.reset()
  currentText.value = ''
  isRunning.value = false
  isPaused.value = false
  isCompleted.value = false
  progress.value = 0
  
  if (outputContainer.value) {
    outputContainer.value.scrollTop = 0
  }
  
  speedController?.reset()
  behaviorTracker?.reset()
  emit('reset')
}

const togglePauseResume = () => {
  if (isPaused.value) {
    resumeStream()
  } else {
    pauseStream()
  }
}

const toggleSmartScroll = () => {
  enableSmartScroll.value = !enableSmartScroll.value
  
  if (enableSmartScroll.value) {
    scrollHelper?.enableSmartScrollFeature()
  } else {
    scrollHelper?.disableSmartScrollFeature()
  }
}

const scrollToBottom = () => {
  scrollHelper?.scrollToBottom(true)
}

// 文本格式化
const formatText = (text: string): string => {
  let result = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
  return result
}

// 监听智能滚动开关
watch(enableSmartScroll, (newValue) => {
  if (newValue) {
    scrollHelper?.enableSmartScrollFeature()
  } else {
    scrollHelper?.disableSmartScrollFeature()
  }
})

// 生命周期
onMounted(() => {
  initModules()
  if (props.autoStart) {
    startStream()
  }
})

onUnmounted(() => {
  streamInstance?.stop()
  scrollHelper?.destroy()
  behaviorTracker?.destroy()
})

// 暴露实例方法
defineExpose({
  start: startStream,
  pause: pauseStream,
  resume: resumeStream,
  reset: resetStream,
  scrollToBottom,
  toggleSmartScroll
})
</script>

<template>
  <div class="ai-stream-scroll-container" :style="{ height: height }">
    <!-- 输出容器 -->
    <div class="ai-stream-scroll-output-wrapper">
      <div 
        ref="outputContainer"
        class="ai-stream-scroll-output"
        v-html="currentText || formatText(placeholder)"
      />
      
      <!-- 进度条 -->
      <div class="ai-stream-scroll-progress">
        <div 
          class="ai-stream-scroll-progress-bar"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- 控制面板 -->
    <div v-if="showControl" class="ai-stream-scroll-control">
      <!-- 状态显示 -->
      <div class="ai-stream-scroll-status">
        <span 
          class="ai-stream-scroll-status-badge"
          :class="{
            'status-auto': scrollStatus.includes('自动'),
            'status-interrupted': scrollStatus.includes('打断'),
            'status-disabled': scrollStatus.includes('禁用'),
            'status-default': !scrollStatus.includes('自动') && !scrollStatus.includes('打断') && !scrollStatus.includes('禁用')
          }"
        >
          {{ scrollStatus }}
        </span>
        <span class="ai-stream-scroll-progress-text">{{ Math.round(progress) }}%</span>
      </div>

      <!-- 控制按钮 -->
      <div class="ai-stream-scroll-buttons">
        <button 
          v-if="!isRunning && !isCompleted"
          @click="startStream"
          class="ai-btn ai-btn-primary"
        >
          开始
        </button>
        <button 
          v-if="isRunning"
          @click="togglePauseResume"
          class="ai-btn"
          :class="isPaused ? 'ai-btn-success' : 'ai-btn-warning'"
        >
          {{ isPaused ? '继续' : '暂停' }}
        </button>
        <button 
          v-if="isCompleted || isRunning"
          @click="resetStream"
          class="ai-btn ai-btn-danger"
        >
          重置
        </button>
        <button 
          @click="scrollToBottom"
          class="ai-btn"
        >
          滚动到底部
        </button>
        <button 
          @click="toggleSmartScroll"
          class="ai-btn"
          :class="enableSmartScroll ? 'ai-btn-info' : ''"
        >
          {{ enableSmartScroll ? '禁用滚动' : '启用滚动' }}
        </button>
      </div>

      <!-- 速度显示 -->
      <div class="ai-stream-scroll-speed">
        <span class="ai-stream-scroll-speed-label">当前速率:</span>
        <span class="ai-stream-scroll-speed-value">{{ currentSpeedDisplay }}</span>
        <span class="ai-stream-scroll-speed-multiplier">{{ speedMultiplierDisplay }}</span>
      </div>

      <!-- 行为统计 -->
      <div v-if="behaviorStats" class="ai-stream-scroll-behavior">
        <span class="ai-stream-scroll-behavior-item">上滑: {{ behaviorStats.upScrollCount }}</span>
        <span class="ai-stream-scroll-behavior-item">下滑: {{ behaviorStats.downScrollCount }}</span>
        <span class="ai-stream-scroll-behavior-item">精读: {{ behaviorStats.readCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-stream-scroll-container {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ai-stream-scroll-output-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-stream-scroll-output {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 14px;
  line-height: 1.8;
  color: #1f2937;
  background: #ffffff;
  word-break: break-word;
}

.ai-stream-scroll-output strong {
  font-weight: 600;
  color: #1f2937;
}

.ai-stream-scroll-progress {
  height: 3px;
  background: #e5e7eb;
}

.ai-stream-scroll-progress-bar {
  height: 100%;
  background: linear-gradient(to right, #3b82f6, #6366f1);
  transition: width 0.3s ease;
}

.ai-stream-scroll-control {
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.ai-stream-scroll-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ai-stream-scroll-status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-auto {
  background: #dcfce7;
  color: #166534;
}

.status-interrupted {
  background: #fef3c7;
  color: #92400e;
}

.status-disabled {
  background: #e5e7eb;
  color: #6b7280;
}

.status-default {
  background: #dbeafe;
  color: #1d4ed8;
}

.ai-stream-scroll-progress-text {
  font-size: 12px;
  color: #6b7280;
}

.ai-stream-scroll-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-btn {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #374151;
}

.ai-btn:hover {
  background: #f3f4f6;
}

.ai-btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.ai-btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.ai-btn-success {
  background: #22c55e;
  border-color: #22c55e;
  color: #ffffff;
}

.ai-btn-success:hover {
  background: #16a34a;
  border-color: #16a34a;
}

.ai-btn-warning {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #ffffff;
}

.ai-btn-warning:hover {
  background: #d97706;
  border-color: #d97706;
}

.ai-btn-danger {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

.ai-btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.ai-btn-info {
  background: #06b6d4;
  border-color: #06b6d4;
  color: #ffffff;
}

.ai-btn-info:hover {
  background: #0891b2;
  border-color: #0891b2;
}

.ai-stream-scroll-speed {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-stream-scroll-speed-label {
  font-size: 12px;
  color: #6b7280;
}

.ai-stream-scroll-speed-value {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}

.ai-stream-scroll-speed-multiplier {
  font-size: 12px;
  color: #06b6d4;
  background: #ecfeff;
  padding: 2px 6px;
  border-radius: 4px;
}

.ai-stream-scroll-behavior {
  display: flex;
  gap: 16px;
}

.ai-stream-scroll-behavior-item {
  font-size: 12px;
  color: #6b7280;
}
</style>
