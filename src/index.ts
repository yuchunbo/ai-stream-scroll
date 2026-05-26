/**
 * AI流式输出+智能随读滚动 Vue3 插件
 * 
 * 提供流式文本输出模拟、智能自适应滚动、行为调速、本地缓存等功能
 * 
 * @module ai-stream-scroll
 */

import { App, Plugin } from 'vue'
import AiStreamScroll from './components/AiStreamScroll.vue'
import type { PluginOptions } from './types'

/**
 * 插件安装选项
 */
export interface AiStreamScrollPluginOptions extends PluginOptions {
  /** 是否全局注册组件 */
  global?: boolean
}

/**
 * 插件安装函数
 * @param app Vue应用实例
 * @param options 插件配置选项
 */
export function install(app: App, options: AiStreamScrollPluginOptions = {}): void {
  // 合并默认配置
  const defaultOptions: PluginOptions = {
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
  }

  // 如果全局注册
  if (options.global !== false) {
    app.component('AiStreamScroll', AiStreamScroll)
    
    // 提供全局配置
    app.provide('aiStreamScrollOptions', { ...defaultOptions, ...options })
  }
}

/**
 * 插件对象
 */
export const AiStreamScrollPlugin: Plugin = {
  install
}

/**
 * 导出组件和类型
 */
export { AiStreamScroll }
export type { PluginOptions, StreamConfig, StreamState, ScrollState, BehaviorStats } from './types'

/**
 * 默认导出
 */
export default AiStreamScrollPlugin
