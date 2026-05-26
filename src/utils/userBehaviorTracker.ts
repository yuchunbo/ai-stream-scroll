/**
 * 用户行为统计工具
 * 用于追踪用户的阅读行为，为个性化滚动速度提供数据支持
 */

export interface BehaviorStats {
  // 内容区块阅读停留时长（毫秒）
  avgStayDuration: number
  // 用户手动上滑次数
  scrollUpCount: number
  // 主动下滑追更次数
  scrollDownCount: number
  // 精读行为频次（文字选中、复制操作）
  intensiveReadCount: number
  // 总交互次数
  totalInteractions: number
  // 最后更新时间
  lastUpdateTime: number
}

export interface UserBehaviorConfig {
  // 停留时间阈值（超过此值认为是深度阅读）
  stayThreshold: number
  // 精读判定时间（选中文字超过此时间算精读）
  intensiveReadThreshold: number
  // 统计有效期（毫秒）
  statsValidity: number
}

export class UserBehaviorTracker {
  private container: HTMLElement | null = null
  private config: UserBehaviorConfig
  private stats: BehaviorStats
  private selectionStartTime: number = 0
  private selectionTimer: ReturnType<typeof setTimeout> | null = null
  private scrollUpDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private scrollDownDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private lastScrollTop: number = 0
  private storageKey: string = 'ai-stream-user-behavior'

  constructor(config?: Partial<UserBehaviorConfig>) {
    this.config = {
      stayThreshold: 3000, // 3 秒以上算深度阅读
      intensiveReadThreshold: 2000, // 选中文字 2 秒以上算精读
      statsValidity: 7 * 24 * 60 * 60 * 1000, // 7 天有效期
      ...config
    }

    this.stats = this.loadFromStorage() || this.createDefaultStats()
  }

  /**
   * 创建默认统计数据
   */
  private createDefaultStats(): BehaviorStats {
    return {
      avgStayDuration: 0,
      scrollUpCount: 0,
      scrollDownCount: 0,
      intensiveReadCount: 0,
      totalInteractions: 0,
      lastUpdateTime: Date.now()
    }
  }

  /**
   * 初始化监听器
   */
  public init(container: HTMLElement): void {
    this.container = container
    
    // 监听文字选中事件
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
    
    // 监听复制事件
    document.addEventListener('copy', this.handleCopy.bind(this))
    
    // 监听点击事件
    container.addEventListener('click', this.handleClick.bind(this))
    
    // 监听长按事件
    container.addEventListener('mousedown', this.handleMouseDown.bind(this))
    container.addEventListener('mouseup', this.handleMouseUp.bind(this))
    
    // 监听滚动事件
    container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
    
    // 监听触摸事件（移动端）
    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
  }

  /**
   * 处理文字选中事件
   */
  private handleSelectionChange = (): void => {
    const selection = window.getSelection()
    
    if (selection && selection.toString().length > 0) {
      // 开始选中
      if (this.selectionStartTime === 0) {
        this.selectionStartTime = Date.now()
        
        // 设置定时器，超过阈值算精读
        this.selectionTimer = setTimeout(() => {
          if (window.getSelection()?.toString().length ?? 0 > 0) {
            this.stats.intensiveReadCount++
            this.stats.totalInteractions++
            this.saveToStorage()
          }
        }, this.config.intensiveReadThreshold)
      }
    } else {
      // 选中结束，清除定时器
      if (this.selectionTimer) {
        clearTimeout(this.selectionTimer)
        this.selectionTimer = null
      }
      this.selectionStartTime = 0
    }
  }

  /**
   * 处理复制事件（精读行为）
   */
  private handleCopy = (): void => {
    this.stats.intensiveReadCount++
    this.stats.totalInteractions++
    this.saveToStorage()
  }

  /**
   * 处理点击事件
   */
  private handleClick = (): void => {
    this.stats.totalInteractions++
    this.saveToStorage()
  }

  /**
   * 处理鼠标按下（长按检测）
   */
  private mouseDownTime: number = 0
  private handleMouseDown = (): void => {
    this.mouseDownTime = Date.now()
  }

  private handleMouseUp = (): void => {
    const duration = Date.now() - this.mouseDownTime
    if (duration >= 1000) { // 长按 1 秒以上
      this.stats.totalInteractions++
      this.saveToStorage()
    }
  }

  /**
   * 处理滚动事件
   */
  private handleScroll = (): void => {
    if (!this.container) return

    const currentScrollTop = this.container.scrollTop
    
    // 防抖处理，避免频繁计数
    if (this.scrollUpDebounceTimer) clearTimeout(this.scrollUpDebounceTimer)
    if (this.scrollDownDebounceTimer) clearTimeout(this.scrollDownDebounceTimer)

    if (currentScrollTop < this.lastScrollTop) {
      // 向上滚动
      this.scrollUpDebounceTimer = setTimeout(() => {
        this.stats.scrollUpCount++
        this.stats.totalInteractions++
        this.saveToStorage()
      }, 300)
    } else if (currentScrollTop > this.lastScrollTop) {
      // 向下滚动
      this.scrollDownDebounceTimer = setTimeout(() => {
        this.stats.scrollDownCount++
        this.stats.totalInteractions++
        this.saveToStorage()
      }, 300)
    }

    this.lastScrollTop = currentScrollTop
  }

  /**
   * 处理触摸开始
   */
  private handleTouchStart = (): void => {
    this.mouseDownTime = Date.now()
  }

  /**
   * 处理触摸结束
   */
  private handleTouchEnd = (): void => {
    const duration = Date.now() - this.mouseDownTime
    if (duration >= 1000) { // 长按 1 秒以上
      this.stats.totalInteractions++
      this.saveToStorage()
    }
  }

  /**
   * 从本地存储加载数据
   */
  private loadFromStorage(): BehaviorStats | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return null

      const data: BehaviorStats = JSON.parse(stored)
      
      // 检查是否过期
      if (Date.now() - data.lastUpdateTime > this.config.statsValidity) {
        return null
      }

      return data
    } catch (e) {
      console.error('Failed to load user behavior stats:', e)
      return null
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      this.stats.lastUpdateTime = Date.now()
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats))
    } catch (e) {
      console.error('Failed to save user behavior stats:', e)
    }
  }

  /**
   * 获取统计数据
   */
  public getStats(): BehaviorStats {
    return { ...this.stats }
  }

  /**
   * 获取阅读速度倾向
   * 返回值：>1 表示偏快，<1 表示偏慢，=1 表示正常
   */
  public getReadingSpeedTendency(): number {
    const { intensiveReadCount, scrollDownCount, scrollUpCount, totalInteractions } = this.stats
    
    if (totalInteractions === 0) return 1.0

    // 精读行为占比
    const intensiveRatio = intensiveReadCount / totalInteractions
    
    // 追更行为占比
    const catchUpRatio = scrollDownCount / totalInteractions
    
    // 回看行为占比
    const reviewRatio = scrollUpCount / totalInteractions

    // 精读多、回看多 -> 速度慢（<1）
    // 追更多 -> 速度快（>1）
    const tendency = 1.0 + (catchUpRatio * 0.3) - (intensiveRatio * 0.3) - (reviewRatio * 0.2)
    
    // 限制在 0.5-1.5 范围
    return Math.max(0.5, Math.min(1.5, tendency))
  }

  /**
   * 重置统计数据
   */
  public reset(): void {
    this.stats = this.createDefaultStats()
    this.saveToStorage()
  }

  /**
   * 销毁监听器
   */
  public destroy(): void {
    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this))
    document.removeEventListener('copy', this.handleCopy.bind(this))
    
    if (this.container) {
      this.container.removeEventListener('click', this.handleClick.bind(this))
      this.container.removeEventListener('mousedown', this.handleMouseDown.bind(this))
      this.container.removeEventListener('mouseup', this.handleMouseUp.bind(this))
      this.container.removeEventListener('scroll', this.handleScroll.bind(this))
      this.container.removeEventListener('touchstart', this.handleTouchStart.bind(this))
      this.container.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    }

    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer)
    }
    if (this.scrollUpDebounceTimer) {
      clearTimeout(this.scrollUpDebounceTimer)
    }
    if (this.scrollDownDebounceTimer) {
      clearTimeout(this.scrollDownDebounceTimer)
    }
  }
}
