<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { mockTexts, createMockStream } from '../src/utils/mockStream'
import { type StreamConfig } from '../src/types'
import { ScrollHelper } from '../src/utils/scrollHelper'
import { SpeedController } from '../src/utils/speedController'
import { BehaviorTracker } from '../src/utils/behaviorTracker'

// ========== 状态管理 ==========
const currentText = ref('')
const isRunning = ref(false)
const isPaused = ref(false)
const isCompleted = ref(false)
const progress = ref(0)
const streamSpeed = ref(50) // 流式输出速度（ms/字符）
const chunkSize = ref<'char' | 'word' | 'sentence'>('sentence')
const selectedTestCase = ref(1)

// 智能滚动开关
const enableSmartScroll = ref(true)

// 手动速度调整（字/分钟）
const manualScrollSpeed = ref(400)
const isManualSpeed = ref(false)

// ========== 核心模块实例 ==========
const outputContainer = ref<HTMLElement | null>(null)
let scrollHelper: ScrollHelper | null = null
let speedController: SpeedController | null = null
let behaviorTracker: BehaviorTracker | null = null
let streamInstance: ReturnType<typeof createMockStream> | null = null

// ========== 测试用例配置 ==========
const testCases = [
  { id: 1, name: '长文本测试1', text: mockTexts.tech, speed: 40 },
  { id: 2, name: '长文本测试2', text: mockTexts.literature, speed: 40 },
  { id: 3, name: '长文本测试3', text: mockTexts.history, speed: 40 },
  { id: 4, name: '长文本测试4', text: mockTexts.science, speed: 40 },
  { id: 5, name: '长文本测试5', text: mockTexts.life, speed: 40 },
  { id: 6, name: '长文本测试6', text: mockTexts.travel, speed: 40 },
  { id: 7, name: '性能测试', text: mockTexts.performance, speed: 10 }
]

// ========== 计算属性：实时状态显示 ==========
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
  
  return '等待内容...'
})

const speedMultiplierDisplay = computed(() => {
  if (!speedController) return '1.0x'
  return `${speedController.getMultiplier().toFixed(2)}x`
})

const behaviorStatsDisplay = computed(() => {
  if (!behaviorTracker) return '统计中...'
  
  const stats = behaviorTracker.getStats()
  return `上滑:${stats.upScrollCount} 下滑:${stats.downScrollCount} 精读:${stats.readCount}`
})

// ========== 初始化核心模块 ==========
const initModules = () => {
  if (!outputContainer.value) return

  // 1. 初始化速度控制器
  speedController = new SpeedController({
    baseSpeed: 400,
    minSpeed: 100,
    maxSpeed: 1200,
    enableCache: true
  })

  // 2. 初始化行为追踪器
  behaviorTracker = new BehaviorTracker()
  behaviorTracker.init(outputContainer.value)

  // 3. 初始化滚动助手
  scrollHelper = new ScrollHelper({
    container: outputContainer.value,
    speedController: speedController,
    behaviorTracker: behaviorTracker,
    triggerPercent: 80,
    topPadding: 20,
    paragraphPauseDuration: 400,
    enableSmartScroll: enableSmartScroll.value
  })
}

// ========== 流式输出处理 ==========
const handleChunk = (chunk: string) => {
  currentText.value += chunk
  progress.value = streamInstance?.getProgress() ?? 0
  
  // 通知滚动助手有新内容（不强制滚动）
  nextTick(() => {
    scrollHelper?.handleNewContent()
  })
}

const handleComplete = () => {
  isRunning.value = false
  isCompleted.value = true
  progress.value = 100
  
  // 停止自动滚动
  scrollHelper?.stopAutoScroll()
}

const handlePause = () => {
  isPaused.value = true
  // 暂停时停止自动滚动
  scrollHelper?.stopAutoScroll()
}

const handleResume = () => {
  isPaused.value = false
  // 继续时恢复自动滚动
  if (enableSmartScroll.value) {
    scrollHelper?.startAutoScroll()
  }
}

// ========== 控制函数 ==========
const startStream = () => {
  if (isRunning.value) return

  const testCase = testCases[selectedTestCase.value - 1]
  streamSpeed.value = testCase.speed

  const config: StreamConfig = {
    speed: streamSpeed.value,
    chunkSize: chunkSize.value
  }

  streamInstance = createMockStream(
    testCase.text,
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
  
  // 启动智能滚动
  if (enableSmartScroll.value) {
    scrollHelper?.startAutoScroll()
  }
  
  streamInstance.start()
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
  
  // 重置滚动
  if (outputContainer.value) {
    outputContainer.value.scrollTop = 0
  }
  
  // 重置速度控制器
  speedController?.reset()
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

const resetUserBehavior = () => {
  behaviorTracker?.reset()
}

// ========== 速度调整功能 ==========
const adjustScrollSpeed = (speed: number) => {
  manualScrollSpeed.value = speed
  isManualSpeed.value = true
  
  if (speedController) {
    speedController.setManualSpeed(speed)
  }
}

const increaseSpeed = () => {
  const newSpeed = Math.min(1200, manualScrollSpeed.value + 50)
  adjustScrollSpeed(newSpeed)
}

const decreaseSpeed = () => {
  const newSpeed = Math.max(100, manualScrollSpeed.value - 50)
  adjustScrollSpeed(newSpeed)
}

const resetSpeed = () => {
  manualScrollSpeed.value = 400
  isManualSpeed.value = false
  
  if (speedController) {
    speedController.reset()
  }
}

// ========== 测试功能 ==========
const runTests = () => {
  console.log('开始运行测试...')
  
  // 测试速度控制器
  const testController = new SpeedController({ baseSpeed: 400 })
  console.log('速度控制器测试:', testController.getState())
  
  testController.adjustSpeed('up', true)
  console.log('向上调速后:', testController.getState())
  
  testController.adjustSpeed('down', true)
  console.log('向下调速后:', testController.getState())
  
  console.log('✓ 测试完成，请查看控制台输出')
}

// ========== 文本格式化 ==========
const formatText = (text: string): string => {
  let result = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
  return result
}

// ========== 生命周期 ==========
onMounted(() => {
  initModules()
})

onUnmounted(() => {
  streamInstance?.stop()
  scrollHelper?.destroy()
  behaviorTracker?.destroy()
})

// ========== 监听智能滚动开关 ==========
watch(enableSmartScroll, (newValue) => {
  if (newValue) {
    scrollHelper?.enableSmartScrollFeature()
  } else {
    scrollHelper?.disableSmartScrollFeature()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-gray-800 text-center">
          AI 流式输出 + 智能随读滚动 Demo
        </h1>
        <p class="text-gray-600 text-center mt-2 text-sm">
          模拟大模型逐字输出，智能自适应滚动，支持个性化调速
        </p>
      </div>
    </header>

    <main class="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 py-6 gap-4">
      <!-- 输出容器 -->
      <div class="bg-white rounded-xl shadow-lg flex flex-col h-[calc(100vh-520px)] min-h-[300px]">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <span class="text-sm text-gray-600">输出内容</span>
          <div class="flex items-center gap-3">
            <span 
              class="text-xs px-2 py-1 rounded-full"
              :class="scrollStatus.includes('自动') ? 'bg-green-100 text-green-700' : scrollStatus.includes('打断') ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ scrollStatus }}
            </span>
            <span class="text-xs text-gray-500">{{ Math.round(progress) }}%</span>
          </div>
        </div>

        <div 
          ref="outputContainer"
          class="flex-1 overflow-y-auto p-4 prose prose-sm max-w-none"
          v-html="formatText(currentText)"
        />

        <div class="h-1 bg-gray-100">
          <div 
            class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="bg-white rounded-xl shadow-lg p-4">
        <!-- 状态显示行 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-2">滚动速度（字/分钟）</div>
            <div class="flex items-center gap-2">
              <button
                @click="decreaseSpeed"
                class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                -
              </button>
              <div class="flex-1">
                <input
                  type="range"
                  v-model="manualScrollSpeed"
                  min="100"
                  max="1200"
                  step="50"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  @input="adjustScrollSpeed(Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <button
                @click="increaseSpeed"
                class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                +
              </button>
            </div>
            <div class="flex items-center justify-center gap-2 mt-2">
              <span class="text-sm font-semibold text-blue-700">{{ manualScrollSpeed }}</span>
              <span class="text-xs text-gray-500">字/分钟</span>
              <span 
                v-if="isManualSpeed" 
                class="text-xs px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full"
              >
                手动
              </span>
            </div>
          </div>
          <div class="bg-purple-50 rounded-lg p-2 text-center">
            <div class="text-xs text-gray-500">速度倍率</div>
            <div class="text-sm font-semibold text-purple-700">{{ speedMultiplierDisplay }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-2 text-center">
            <div class="text-xs text-gray-500">用户行为</div>
            <div class="text-xs font-medium text-green-700">{{ behaviorStatsDisplay }}</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-2 text-center">
            <div class="text-xs text-gray-500">智能滚动</div>
            <div class="text-sm font-semibold" :class="enableSmartScroll ? 'text-green-700' : 'text-gray-500'">
              {{ enableSmartScroll ? '已开启' : '已关闭' }}
            </div>
          </div>
        </div>

        <!-- 控制按钮行 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">测试用例</label>
            <select 
              v-model="selectedTestCase"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              :disabled="isRunning"
            >
              <option v-for="caseItem in testCases" :key="caseItem.id" :value="caseItem.id">
                {{ caseItem.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">输出模式</label>
            <select 
              v-model="chunkSize"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              :disabled="isRunning"
            >
              <option value="char">逐字输出</option>
              <option value="word">逐词输出</option>
              <option value="sentence">逐句输出</option>
            </select>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">
              流式速度：{{ streamSpeed }}ms
            </label>
            <input 
              type="range" 
              v-model="streamSpeed"
              min="10" 
              max="200" 
              step="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              :disabled="isRunning"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">基础控制</label>
            <div class="flex gap-2">
              <button 
                @click="startStream"
                :disabled="isRunning || isCompleted"
                class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {{ isCompleted ? '重新开始' : '开始' }}
              </button>
              <button 
                @click="togglePauseResume"
                :disabled="!isRunning"
                class="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {{ isPaused ? '继续' : '暂停' }}
              </button>
              <button 
                @click="resetStream"
                class="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        <!-- 高级控制行 -->
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div>
              <div class="text-sm font-medium text-gray-700">智能随读滚动</div>
              <div class="text-xs text-gray-500">自动跟随新内容滚动</div>
            </div>
            <button
              @click="toggleSmartScroll"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="enableSmartScroll ? 'bg-blue-500' : 'bg-gray-300'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="enableSmartScroll ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div>
              <div class="text-sm font-medium text-gray-700">用户行为统计</div>
              <div class="text-xs text-gray-500">个性化调速依据</div>
            </div>
            <div class="flex gap-2">
              <button
                @click="resetUserBehavior"
                class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                重置统计
              </button>
              <button
                @click="resetSpeed"
                class="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
              >
                重置速度
              </button>
              <button
                @click="runTests"
                class="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                运行测试
              </button>
            </div>
          </div>
        </div>

        <!-- 操作说明 -->
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 mb-2">操作说明</h4>
          <ul class="text-xs text-gray-600 space-y-1">
            <li>• 点击「开始」启动流式输出，内容达到 80% 视口高度时自动启动滚动</li>
            <li>• 任何手动操作（滚动、触摸、点击、选中文字）会立即打断自动滚动</li>
            <li>• 滚动回底部自动恢复智能滚动</li>
            <li>• 系统会根据您的阅读行为自动调整滚动速度（精读调慢，追更调快）</li>
            <li>• 段落结尾自动暂停 0.4 秒，模拟阅读停顿</li>
            <li>• 速度数据本地缓存，跨会话自动复用</li>
          </ul>
        </div>
      </div>
    </main>

    <footer class="py-4 text-center text-sm text-gray-500">
      <p>Vue3 + TypeScript + Vite | 智能自适应滚动 v2.0</p>
    </footer>
  </div>
</template>

<style scoped>
.prose :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.prose :deep(br) {
  line-height: 1.75;
}
</style>
