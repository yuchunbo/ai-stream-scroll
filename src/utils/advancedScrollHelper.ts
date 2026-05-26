/**
 * 高级滚动控制工具
 * 实现基础滚动规则、打断监听、个性化调速
 * 优先级：用户手动操作 > 个人定制速度 > 场景适配速度 > 系统默认基准速度
 */

import { SpeedController } from './speedController'
import { UserBehaviorTracker } from './userBehaviorTracker'

export interface AdvancedScrollOptions {
  container: HTMLElement
  speedController: SpeedController
  behaviorTracker: UserBehaviorTracker
  viewportThreshold?: number
  topPadding?: number
  paragraphPauseDuration?: number
  enableSmartScroll?: boolean
}

export interface ScrollState {
  isAutoScrolling: boolean
  isInterrupted: boolean
  isAtBottom: boolean
  scrollPosition: number
  contentHeight: number
  viewportHeight: number
}

export class AdvancedScrollHelper {
  private container: HTMLElement
  private speedController: SpeedController
  private behaviorTracker: UserBehaviorTracker
  private topPadding: number
  private paragraphPauseDuration: number
  private enableSmartScroll: boolean

  // 滚动控制
  private scrollAnimationFrame: number | null = null
  private scrollInterval: ReturnType<typeof setInterval> | null = null
  private isAutoScrolling: boolean = false
  private isInterrupted: boolean = false
  private lastScrollTop: number = 0
  
  // 关键修复：区分用户滚动和程序滚动
  private isProgramScrolling: boolean = false
  private ignoreNextScrollEvent: boolean = false

  // 段落暂停
  private paragraphPauseTimer: ReturnType<typeof setTimeout> | null = null

  // 事件监听器
  private boundHandlers: {
    handleScroll: () => void
    handleWheel: () => void
    handleTouchStart: () => void
    handleTouchMove: () => void
    handleTouchEnd: () => void
    handleMouseDown: () => void
    handleClick: () => void
  }

  constructor(options: AdvancedScrollOptions) {
    this.container = options.container
    this.speedController = options.speedController
    this.behaviorTracker = options.behaviorTracker
    this.topPadding = options.topPadding ?? 20
    this.paragraphPauseDuration = options.paragraphPauseDuration ?? 400
    this.enableSmartScroll = options.enableSmartScroll ?? true

    this.behaviorTracker.init(this.container)

    this.boundHandlers = {
      handleScroll: this.handleScroll.bind(this),
      handleWheel: this.handleWheel.bind(this),
      handleTouchStart: this.handleTouchStart.bind(this),
      handleTouchMove: this.handleTouchMove.bind(this),
      handleTouchEnd: this.handleTouchEnd.bind(this),
      handleMouseDown: this.handleMouseDown.bind(this),
      handleClick: this.handleClick.bind(this)
    }

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.container.addEventListener('scroll', this.boundHandlers.handleScroll, { passive: true })
    this.container.addEventListener('wheel', this.boundHandlers.handleWheel, { passive: true })
    this.container.addEventListener('touchstart', this.boundHandlers.handleTouchStart, { passive: true })
    this.container.addEventListener('touchmove', this.boundHandlers.handleTouchMove, { passive: true })
    this.container.addEventListener('touchend', this.boundHandlers.handleTouchEnd, { passive: true })
    this.container.addEventListener('mousedown', this.boundHandlers.handleMouseDown, { passive: true })
    this.container.addEventListener('click', this.boundHandlers.handleClick, { passive: true })
  }

  private removeEventListeners(): void {
    this.container.removeEventListener('scroll', this.boundHandlers.handleScroll)
    this.container.removeEventListener('wheel', this.boundHandlers.handleWheel)
    this.container.removeEventListener('touchstart', this.boundHandlers.handleTouchStart)
    this.container.removeEventListener('touchmove', this.boundHandlers.handleTouchMove)
    this.container.removeEventListener('touchend', this.boundHandlers.handleTouchEnd)
    this.container.removeEventListener('mousedown', this.boundHandlers.handleMouseDown)
    this.container.removeEventListener('click', this.boundHandlers.handleClick)
  }

  /**
   * 处理滚动事件（用户手动滚动）
   * 关键修复：只有当用户真正手动滚动时才打断自动滚动
   */
  private handleScroll(): void {
    const currentScrollTop = this.container.scrollTop
    
    // 如果是程序滚动，忽略这次滚动事件
    if (this.ignoreNextScrollEvent) {
      this.ignoreNextScrollEvent = false
      this.lastScrollTop = currentScrollTop
      return
    }

    // 检测是否是用户手动滚动
    // 只有当不是程序滚动且位置变化超过阈值时，才认为是用户滚动
    const isUserScroll = !this.isProgramScrolling && 
                         Math.abs(currentScrollTop - this.lastScrollTop) > 1

    if (isUserScroll) {
      this.interruptAutoScroll()
    }

    this.lastScrollTop = currentScrollTop

    // 检查是否回到底部
    if (this.checkIfAtBottom() && this.isInterrupted && this.enableSmartScroll) {
      this.resumeAutoScroll()
    }
  }

  private handleWheel(): void {
    this.interruptAutoScroll()
  }

  private handleTouchStart(): void {
    this.interruptAutoScroll()
  }

  private handleTouchMove(): void {
    this.interruptAutoScroll()
  }

  private handleTouchEnd(): void {
    if (this.checkIfAtBottom() && this.isInterrupted && this.enableSmartScroll) {
      this.resumeAutoScroll()
    }
  }

  private handleMouseDown(): void {
    this.interruptAutoScroll()
  }

  private handleClick(): void {
    // 点击不打断滚动，只在拖拽/滚动时打断
  }

  private interruptAutoScroll(): void {
    if (!this.isAutoScrolling) return

    this.isInterrupted = true
    this.isProgramScrolling = false
    this.stopAutoScroll()
    
    this.speedController.adjustSpeed('down', false)
  }

  private checkIfAtBottom(): boolean {
    const { scrollTop, scrollHeight, clientHeight } = this.container
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    return distanceToBottom <= 10
  }

  private shouldAutoScroll(): boolean {
    if (!this.enableSmartScroll) return false
    if (this.isInterrupted) return false

    const { scrollHeight, clientHeight } = this.container
    const contentRatio = scrollHeight / clientHeight

    // 内容高度达到可视区域 80% 以上时启动
    return contentRatio >= 1.2
  }

  /**
   * 启动自动滚动
   */
  public startAutoScroll(): void {
    if (this.isAutoScrolling) return
    if (!this.shouldAutoScroll()) return

    this.isAutoScrolling = true
    this.isInterrupted = false
    this.isProgramScrolling = true

    const scrollInterval = 50
    this.scrollInterval = setInterval(() => {
      if (!this.isAutoScrolling || this.isInterrupted) {
        this.isProgramScrolling = false
        this.stopAutoScroll()
        return
      }

      const scrollRate = this.speedController.getScrollRate()
      const scrollDistance = scrollRate * scrollInterval
      const { scrollTop, scrollHeight, clientHeight } = this.container

      // 计算最大可滚动距离
      const maxScroll = scrollHeight - clientHeight - this.topPadding
      
      if (scrollTop >= maxScroll) {
        // 已经到达底部，等待新内容
        return
      }

      // 设置标志避免误判
      this.ignoreNextScrollEvent = true
      
      // 执行滚动
      this.container.scrollTop = Math.min(maxScroll, scrollTop + scrollDistance)

    }, scrollInterval)
  }

  public stopAutoScroll(): void {
    this.isAutoScrolling = false
    this.isProgramScrolling = false

    if (this.scrollInterval) {
      clearInterval(this.scrollInterval)
      this.scrollInterval = null
    }

    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame)
      this.scrollAnimationFrame = null
    }
  }

  public resumeAutoScroll(): void {
    this.isInterrupted = false
    this.startAutoScroll()
  }

  /**
   * 处理新内容追加
   */
  public handleNewContent(): void {
    const isParagraphEnd = this.checkParagraphEnd()
    
    if (isParagraphEnd && this.isAutoScrolling) {
      this.pauseForParagraph()
    }

    // 如果正在自动滚动且没有被打断，继续滚动
    if (this.isAutoScrolling && !this.isInterrupted) {
      // 确保在新内容添加后继续滚动
      requestAnimationFrame(() => {
        this.continueScrolling()
      })
    } else if (!this.isAutoScrolling && !this.isInterrupted && this.shouldAutoScroll()) {
      // 如果还没开始自动滚动，但条件满足，则启动
      this.startAutoScroll()
    }
  }

  /**
   * 继续滚动（在新内容添加后调用）
   */
  private continueScrolling(): void {
    if (!this.isAutoScrolling || this.isInterrupted) return

    const { scrollTop, scrollHeight, clientHeight } = this.container
    const maxScroll = scrollHeight - clientHeight - this.topPadding

    if (scrollTop < maxScroll) {
      this.ignoreNextScrollEvent = true
      const scrollRate = this.speedController.getScrollRate()
      this.container.scrollTop = Math.min(maxScroll, scrollTop + scrollRate * 50)
    }
  }

  private checkParagraphEnd(): boolean {
    const text = this.container.textContent ?? ''
    const lastChar = text.slice(-1)
    return ['\n', '。', '！', '？', '!', '?'].includes(lastChar)
  }

  private pauseForParagraph(): void {
    this.stopAutoScroll()
    
    this.paragraphPauseTimer = setTimeout(() => {
      if (!this.isInterrupted && this.enableSmartScroll) {
        this.startAutoScroll()
      }
    }, this.paragraphPauseDuration)
  }

  public scrollToBottom(smooth: boolean = true): void {
    const { scrollHeight, clientHeight } = this.container
    const targetScrollTop = scrollHeight - clientHeight

    if (smooth) {
      const startScrollTop = this.container.scrollTop
      const distance = targetScrollTop - startScrollTop
      const duration = 300
      const startTime = performance.now()

      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3)
      }

      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeOutCubic(progress)
        
        this.ignoreNextScrollEvent = true
        this.container.scrollTop = startScrollTop + distance * easedProgress

        if (progress < 1) {
          this.scrollAnimationFrame = requestAnimationFrame(animate)
        }
      }

      this.scrollAnimationFrame = requestAnimationFrame(animate)
    } else {
      this.ignoreNextScrollEvent = true
      this.container.scrollTop = targetScrollTop
    }
  }

  public enableSmartScrollFeature(): void {
    this.enableSmartScroll = true
    if (this.checkIfAtBottom()) {
      this.resumeAutoScroll()
    }
  }

  public disableSmartScrollFeature(): void {
    this.enableSmartScroll = false
    this.stopAutoScroll()
  }

  public getState(): ScrollState {
    const { scrollTop, scrollHeight, clientHeight } = this.container
    
    return {
      isAutoScrolling: this.isAutoScrolling,
      isInterrupted: this.isInterrupted,
      isAtBottom: this.checkIfAtBottom(),
      scrollPosition: scrollTop,
      contentHeight: scrollHeight,
      viewportHeight: clientHeight
    }
  }

  public destroy(): void {
    this.stopAutoScroll()
    
    if (this.paragraphPauseTimer) {
      clearTimeout(this.paragraphPauseTimer)
      this.paragraphPauseTimer = null
    }

    this.removeEventListeners()
    this.behaviorTracker.destroy()
  }
}
