/**
 * 智能滚动助手
 * 实现智能自适应随读滚动
 */

import type { ScrollState } from '../types'
import { SpeedController } from './speedController'
import { BehaviorTracker } from './behaviorTracker'

export interface ScrollHelperOptions {
  container: HTMLElement
  speedController: SpeedController
  behaviorTracker: BehaviorTracker
  triggerPercent?: number
  topPadding?: number
  paragraphPauseDuration?: number
  enableSmartScroll?: boolean
}

export class ScrollHelper {
  private container: HTMLElement
  private speedController: SpeedController
  private behaviorTracker: BehaviorTracker
  private triggerPercent: number
  private topPadding: number
  private paragraphPauseDuration: number
  private enableSmartScroll: boolean

  // 滚动控制
  private scrollInterval: ReturnType<typeof setInterval> | null = null
  private scrollAnimationFrame: number | null = null
  private isAutoScrolling: boolean = false
  private isInterrupted: boolean = false
  private lastScrollTop: number = 0
  
  // 区分用户滚动和程序滚动
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
  }

  constructor(options: ScrollHelperOptions) {
    this.container = options.container
    this.speedController = options.speedController
    this.behaviorTracker = options.behaviorTracker
    this.triggerPercent = options.triggerPercent ?? 80
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
      handleMouseDown: this.handleMouseDown.bind(this)
    }

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.container.addEventListener('scroll', this.boundHandlers.handleScroll, { passive: true })
    this.container.addEventListener('wheel', this.boundHandlers.handleWheel, { passive: true })
    this.container.addEventListener('touchstart', this.boundHandlers.handleTouchStart, { passive: true })
    this.container.addEventListener('touchmove', this.boundHandlers.handleTouchMove, { passive: true })
    this.container.addEventListener('touchend', this.boundHandlers.handleTouchEnd, { passive: true })
    this.container.addEventListener('mousedown', this.boundHandlers.handleMouseDown, { passive: true })
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners(): void {
    this.container.removeEventListener('scroll', this.boundHandlers.handleScroll)
    this.container.removeEventListener('wheel', this.boundHandlers.handleWheel)
    this.container.removeEventListener('touchstart', this.boundHandlers.handleTouchStart)
    this.container.removeEventListener('touchmove', this.boundHandlers.handleTouchMove)
    this.container.removeEventListener('touchend', this.boundHandlers.handleTouchEnd)
    this.container.removeEventListener('mousedown', this.boundHandlers.handleMouseDown)
  }

  /**
   * 处理滚动事件
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
    const isUserScroll = !this.isAutoScrolling && 
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

  /**
   * 中断自动滚动
   */
  private interruptAutoScroll(): void {
    if (!this.isAutoScrolling) return

    this.isInterrupted = true
    this.stopAutoScroll()
    
    // 行为分析：用户手动滚动，可能需要调整速度
    const stats = this.behaviorTracker.getStats()
    if (stats.upScrollCount > stats.downScrollCount) {
      this.speedController.adjustSpeed('down', true)
    }
  }

  /**
   * 检查是否在底部
   */
  private checkIfAtBottom(): boolean {
    const { scrollTop, scrollHeight, clientHeight } = this.container
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    return distanceToBottom <= 10
  }

  /**
   * 判断是否应该启动自动滚动
   */
  private shouldAutoScroll(): boolean {
    if (!this.enableSmartScroll) return false
    if (this.isInterrupted) return false

    const { scrollHeight, clientHeight } = this.container
    const contentRatio = scrollHeight / clientHeight

    // 内容高度达到可视区域一定比例时启动
    return contentRatio >= this.triggerPercent / 50
  }

  /**
   * 启动自动滚动
   */
  public startAutoScroll(): void {
    if (this.isAutoScrolling) return
    if (!this.shouldAutoScroll()) return

    this.isAutoScrolling = true
    this.isInterrupted = false

    const scrollInterval = 50
    this.scrollInterval = setInterval(() => {
      if (!this.isAutoScrolling || this.isInterrupted) {
        this.stopAutoScroll()
        return
      }

      const scrollRate = this.speedController.getScrollRate()
      const scrollDistance = scrollRate * scrollInterval
      const { scrollTop, scrollHeight, clientHeight } = this.container

      // 计算最大可滚动距离
      const maxScroll = scrollHeight - clientHeight - this.topPadding
      
      if (scrollTop >= maxScroll) {
        return
      }

      // 设置标志避免误判
      this.ignoreNextScrollEvent = true
      
      // 执行滚动
      this.container.scrollTop = Math.min(maxScroll, scrollTop + scrollDistance)

    }, scrollInterval)
  }

  /**
   * 停止自动滚动
   */
  public stopAutoScroll(): void {
    this.isAutoScrolling = false

    if (this.scrollInterval) {
      clearInterval(this.scrollInterval)
      this.scrollInterval = null
    }

    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame)
      this.scrollAnimationFrame = null
    }
  }

  /**
   * 恢复自动滚动
   */
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
      requestAnimationFrame(() => {
        this.continueScrolling()
      })
    } else if (!this.isAutoScrolling && !this.isInterrupted && this.shouldAutoScroll()) {
      // 如果还没开始自动滚动，但条件满足，则启动
      this.startAutoScroll()
    }
  }

  /**
   * 继续滚动
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

  /**
   * 检查是否是段落结尾
   */
  private checkParagraphEnd(): boolean {
    const text = this.container.textContent ?? ''
    const lastChar = text.slice(-1)
    return ['\n', '。', '！', '？', '!', '?'].includes(lastChar)
  }

  /**
   * 段落暂停
   */
  private pauseForParagraph(): void {
    this.stopAutoScroll()
    
    this.paragraphPauseTimer = setTimeout(() => {
      if (!this.isInterrupted && this.enableSmartScroll) {
        this.startAutoScroll()
      }
    }, this.paragraphPauseDuration)
  }

  /**
   * 平滑滚动到底部
   * @param smooth 是否平滑滚动
   */
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

  /**
   * 启用智能滚动功能
   */
  public enableSmartScrollFeature(): void {
    this.enableSmartScroll = true
    if (this.checkIfAtBottom()) {
      this.resumeAutoScroll()
    }
  }

  /**
   * 禁用智能滚动功能
   */
  public disableSmartScrollFeature(): void {
    this.enableSmartScroll = false
    this.stopAutoScroll()
  }

  /**
   * 获取当前状态
   */
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

  /**
   * 销毁实例
   */
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
