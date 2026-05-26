/**
 * 用户行为追踪器
 * 统计用户阅读行为，用于个性化速度调整
 */

import type { BehaviorStats } from '../types'

export class BehaviorTracker {
  private container: HTMLElement | null = null
  private stats: BehaviorStats = {
    upScrollCount: 0,
    downScrollCount: 0,
    readCount: 0,
    avgStayDuration: 0
  }
  private lastScrollTop = 0
  private sectionStartTime = 0
  private stayDurations: number[] = []

  /**
   * 初始化行为追踪器
   * @param container 目标容器元素
   */
  init(container: HTMLElement): void {
    this.container = container
    this.setupEventListeners()
    this.sectionStartTime = Date.now()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.container) return

    this.container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: true })
    document.addEventListener('copy', this.handleCopy.bind(this))
  }

  /**
   * 移除事件监听器
   */
  destroy(): void {
    if (!this.container) return

    this.container.removeEventListener('scroll', this.handleScroll.bind(this))
    this.container.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    document.removeEventListener('copy', this.handleCopy.bind(this))
  }

  /**
   * 处理滚动事件
   */
  private handleScroll(): void {
    if (!this.container) return

    const currentScrollTop = this.container.scrollTop
    const diff = currentScrollTop - this.lastScrollTop

    // 记录停留时长
    if (Math.abs(diff) < 1) {
      // 没有滚动，继续停留
      return
    }

    // 滚动了，记录上一段停留时长
    const stayDuration = Date.now() - this.sectionStartTime
    if (stayDuration > 1000) {
      this.stayDurations.push(stayDuration)
      this.updateAvgStayDuration()
    }

    // 判断滚动方向
    if (diff > 5) {
      this.stats.downScrollCount++
    } else if (diff < -5) {
      this.stats.upScrollCount++
    }

    this.lastScrollTop = currentScrollTop
    this.sectionStartTime = Date.now()
  }

  /**
   * 处理鼠标抬起事件（检测选中文本）
   */
  private handleMouseUp(): void {
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 5) {
      this.stats.readCount++
    }
  }

  /**
   * 处理复制事件
   */
  private handleCopy(): void {
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 5) {
      this.stats.readCount++
    }
  }

  /**
   * 更新平均停留时长
   */
  private updateAvgStayDuration(): void {
    if (this.stayDurations.length === 0) {
      this.stats.avgStayDuration = 0
      return
    }
    const sum = this.stayDurations.reduce((a, b) => a + b, 0)
    this.stats.avgStayDuration = Math.round(sum / this.stayDurations.length)
  }

  /**
   * 获取当前统计数据
   */
  getStats(): BehaviorStats {
    return { ...this.stats }
  }

  /**
   * 判断是否为精读行为
   */
  isDeepReading(): boolean {
    return this.stats.readCount > 0 || this.stats.avgStayDuration > 5000
  }

  /**
   * 判断是否为快速浏览
   */
  isFastBrowsing(): boolean {
    return this.stats.downScrollCount > this.stats.upScrollCount * 2
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.stats = {
      upScrollCount: 0,
      downScrollCount: 0,
      readCount: 0,
      avgStayDuration: 0
    }
    this.stayDurations = []
    this.sectionStartTime = Date.now()
  }
}
