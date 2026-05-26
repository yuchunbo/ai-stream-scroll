/**
 * 速度控制器
 * 管理滚动速度，支持行为调速和本地缓存
 */

import type { SpeedControllerConfig, SpeedState, SpeedDirection } from '../types'

export class SpeedController {
  private baseSpeed: number
  private minSpeed: number
  private maxSpeed: number
  private enableCache: boolean
  private cacheKey: string
  private currentSpeed: number = 0
  private multiplier: number = 1
  private isManual: boolean = false

  constructor(config: SpeedControllerConfig) {
    this.baseSpeed = config.baseSpeed
    this.minSpeed = config.minSpeed ?? 100
    this.maxSpeed = config.maxSpeed ?? 1200
    this.enableCache = config.enableCache ?? false
    this.cacheKey = config.cacheKey ?? 'ai-stream-scroll-speed'

    // 从缓存加载速度
    this.loadFromCache()
  }

  /**
   * 从本地缓存加载速度配置
   */
  private loadFromCache(): void {
    if (!this.enableCache) {
      this.currentSpeed = this.baseSpeed
      return
    }

    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        if (typeof data.currentSpeed === 'number') {
          this.currentSpeed = data.currentSpeed
        } else {
          this.currentSpeed = this.baseSpeed
        }
        if (typeof data.multiplier === 'number') {
          this.multiplier = data.multiplier
        }
      } else {
        this.currentSpeed = this.baseSpeed
      }
    } catch {
      this.currentSpeed = this.baseSpeed
    }
  }

  /**
   * 保存速度配置到本地缓存
   */
  private saveToCache(): void {
    if (!this.enableCache) return

    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        currentSpeed: this.currentSpeed,
        multiplier: this.multiplier
      }))
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 获取当前速度（字/分钟）
   */
  getCurrentSpeed(): number {
    return this.currentSpeed
  }

  /**
   * 获取速度倍率
   */
  getMultiplier(): number {
    return this.multiplier
  }

  /**
   * 获取滚动速率（像素/毫秒）
   * 基于当前速度计算
   */
  getScrollRate(): number {
    // 400字/分钟 = 大约2像素/毫秒
    // 根据速度比例调整
    return (this.currentSpeed / 400) * 0.02
  }

  /**
   * 调整速度
   * @param direction 调整方向：up-加快，down-减慢
   * @param fromBehavior 是否来自行为分析
   */
  adjustSpeed(direction: SpeedDirection, fromBehavior: boolean): void {
    // 如果是手动设置的速度，行为分析不覆盖
    if (fromBehavior && this.isManual) return

    const changePercent = 0.05 // 每次调整5%

    if (direction === 'up') {
      this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed * (1 + changePercent))
      this.multiplier = this.currentSpeed / this.baseSpeed
    } else {
      this.currentSpeed = Math.max(this.minSpeed, this.currentSpeed * (1 - changePercent))
      this.multiplier = this.currentSpeed / this.baseSpeed
    }

    this.saveToCache()
  }

  /**
   * 手动设置速度
   * @param speed 目标速度（字/分钟）
   */
  setManualSpeed(speed: number): void {
    this.currentSpeed = Math.max(this.minSpeed, Math.min(this.maxSpeed, speed))
    this.multiplier = this.currentSpeed / this.baseSpeed
    this.isManual = true
    this.saveToCache()
  }

  /**
   * 重置为默认速度
   */
  reset(): void {
    this.currentSpeed = this.baseSpeed
    this.multiplier = 1
    this.isManual = false
    this.saveToCache()
  }

  /**
   * 获取当前状态
   */
  getState(): SpeedState {
    return {
      currentSpeed: Math.round(this.currentSpeed),
      multiplier: Number(this.multiplier.toFixed(2)),
      isManual: this.isManual
    }
  }
}
