/**
 * AI流式输出+智能随读滚动插件类型定义
 */

export interface StreamConfig {
  /** 输出速度（毫秒间隔） */
  speed: number
  /** 输出模式：逐字/逐词/逐句 */
  chunkSize: 'char' | 'word' | 'sentence'
}

export interface StreamState {
  /** 是否正在运行 */
  isRunning: boolean
  /** 是否暂停 */
  isPaused: boolean
  /** 进度百分比 */
  progress: number
  /** 当前索引 */
  currentIndex: number
}

export interface ScrollState {
  /** 是否自动滚动中 */
  isAutoScrolling: boolean
  /** 是否被用户打断 */
  isInterrupted: boolean
  /** 是否在底部 */
  isAtBottom: boolean
  /** 当前滚动位置 */
  scrollPosition: number
  /** 内容高度 */
  contentHeight: number
  /** 视口高度 */
  viewportHeight: number
}

export interface BehaviorStats {
  /** 上滑次数 */
  upScrollCount: number
  /** 下滑次数 */
  downScrollCount: number
  /** 精读次数（选中文本） */
  readCount: number
  /** 平均停留时长（毫秒） */
  avgStayDuration: number
}

export interface PluginOptions {
  /** 初始文本内容 */
  initialText?: string
  /** Mock输出速度（毫秒），默认40 */
  mockSpeed?: number
  /** 是否自动开始 */
  autoStart?: boolean
  /** 滚动触发百分比（0-100），默认80 */
  triggerPercent?: number
  /** 基准滚动速度（字/分钟），默认400 */
  baseSpeed?: number
  /** 是否启用行为调速 */
  enableBehaviorAdjust?: boolean
  /** 最小速度（字/分钟），默认100 */
  speedMin?: number
  /** 最大速度（字/分钟），默认1200 */
  speedMax?: number
  /** 是否启用本地缓存 */
  enableLocalCache?: boolean
  /** 缓存键名 */
  cacheKey?: string
  /** 组件高度 */
  height?: string
  /** 占位文本 */
  placeholder?: string
  /** 是否显示控制面板 */
  showControl?: boolean
  /** 段落暂停时长（毫秒），默认400 */
  paragraphPauseDuration?: number
  /** 顶部留白（像素），默认20 */
  topPadding?: number
}

export interface SpeedControllerConfig {
  /** 基准速度（字/分钟） */
  baseSpeed: number
  /** 最小速度 */
  minSpeed?: number
  /** 最大速度 */
  maxSpeed?: number
  /** 是否启用本地缓存 */
  enableCache?: boolean
  /** 缓存键名 */
  cacheKey?: string
}

export interface SpeedState {
  /** 当前速度（字/分钟） */
  currentSpeed: number
  /** 速度倍率 */
  multiplier: number
  /** 是否手动设置 */
  isManual: boolean
}

export type SpeedDirection = 'up' | 'down'

export interface EventPayload {
  /** 事件名称 */
  name: string
  /** 附加数据 */
  data?: Record<string, unknown>
}
