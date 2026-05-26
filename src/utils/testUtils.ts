/**
 * 测试工具函数
 * 用于验证智能滚动、调速、打断等核心功能
 */

import { SpeedController } from './speedController'
import { BehaviorTracker } from './behaviorTracker'
import { ScrollHelper } from './scrollHelper'

/**
 * 测试速度控制器
 */
export function testSpeedController(): void {
  console.log('=== 测试速度控制器 ===')
  
  const controller = new SpeedController({
    baseSpeed: 400,
    minSpeed: 100,
    maxSpeed: 1200
  })

  // 测试 1: 初始状态
  const initialState = controller.getState()
  console.assert(initialState.currentSpeed === 400, '初始速度应为 400')
  console.assert(initialState.multiplier === 1.0, '初始倍率应为 1.0')
  console.log('✓ 初始状态正确')

  // 测试 2: 向上调速
  controller.adjustSpeed('up', true)
  const upState = controller.getState()
  console.assert(upState.currentSpeed > 400, '向上调速后速度应增加')
  console.log(`✓ 向上调速：${upState.currentSpeed} 字/分钟 (${upState.multiplier.toFixed(2)}x)`)

  // 测试 3: 向下调速
  controller.adjustSpeed('down', true)
  const downState = controller.getState()
  console.assert(downState.currentSpeed < upState.currentSpeed, '向下调速后速度应减少')
  console.log(`✓ 向下调速：${downState.currentSpeed} 字/分钟`)

  // 测试 4: 手动设置速度（锁定）
  controller.setManualSpeed(600)
  const manualState = controller.getState()
  console.assert(manualState.currentSpeed === 600, '手动设置速度应为 600')
  console.assert(manualState.isManual === true, '手动设置后应锁定')
  console.log('✓ 手动设置速度并锁定')

  // 测试 5: 重置
  controller.reset()
  const resetState = controller.getState()
  console.assert(resetState.currentSpeed === 400, '重置后速度应回到基准')
  console.assert(resetState.isManual === false, '重置后应解锁')
  console.log('✓ 重置成功')

  console.log('=== 速度控制器测试完成 ===\n')
}

/**
 * 测试行为追踪器
 */
export function testBehaviorTracker(): void {
  console.log('=== 测试行为追踪器 ===')
  
  const tracker = new BehaviorTracker()
  
  // 创建模拟容器
  const container = document.createElement('div')
  container.style.width = '300px'
  container.style.height = '400px'
  container.style.overflow = 'auto'
  document.body.appendChild(container)
  
  tracker.init(container)

  // 测试 1: 初始统计
  const initialStats = tracker.getStats()
  console.assert(initialStats.upScrollCount === 0, '初始上滑次数应为 0')
  console.log('✓ 初始统计正确')

  // 测试 2: 模拟滚动
  container.scrollTop = 100
  setTimeout(() => {
    container.scrollTop = 50
    setTimeout(() => {
      const afterScrollStats = tracker.getStats()
      console.assert(afterScrollStats.upScrollCount >= 1, '上滑次数应增加')
      console.log('✓ 滚动事件追踪成功')

      // 测试 3: 获取统计
      const stats = tracker.getStats()
      console.log(`✓ 上滑次数：${stats.upScrollCount}`)
      console.log(`✓ 下滑次数：${stats.downScrollCount}`)

      // 清理
      tracker.destroy()
      document.body.removeChild(container)
      console.log('=== 行为追踪器测试完成 ===\n')
    }, 100)
  }, 100)
}

/**
 * 测试滚动助手
 */
export function testScrollHelper(): void {
  console.log('=== 测试滚动助手 ===')
  
  // 创建模拟容器
  const container = document.createElement('div')
  container.style.width = '300px'
  container.style.height = '400px'
  container.style.overflow = 'auto'
  document.body.appendChild(container)
  
  // 添加内容
  const content = document.createElement('div')
  content.style.height = '1000px'
  content.textContent = '测试内容'.repeat(100)
  container.appendChild(content)
  
  const speedController = new SpeedController({
    baseSpeed: 400,
    minSpeed: 100,
    maxSpeed: 1200
  })
  const behaviorTracker = new BehaviorTracker()
  behaviorTracker.init(container)
  
  const scrollHelper = new ScrollHelper({
    container,
    speedController,
    behaviorTracker,
    triggerPercent: 80,
    topPadding: 20,
    paragraphPauseDuration: 400,
    enableSmartScroll: true
  })

  // 测试 1: 初始状态
  const initialState = scrollHelper.getState()
  console.assert(initialState.isAutoScrolling === false, '初始状态不应自动滚动')
  console.log('✓ 初始状态正确')

  // 测试 2: 检查是否在底部
  const beforeScroll = scrollHelper.getState()
  console.assert(beforeScroll.isAtBottom === false, '有滚动内容时不应在底部')
  console.log('✓ 底部检测正确')

  // 测试 3: 手动滚动到底部
  scrollHelper.scrollToBottom(false)
  setTimeout(() => {
    const afterScroll = scrollHelper.getState()
    console.assert(afterScroll.isAtBottom === true, '滚动后应在底部')
    console.log('✓ 手动滚动到底部成功')

    // 测试 4: 打断检测
    scrollHelper.startAutoScroll()
    const duringScroll = scrollHelper.getState()
    console.assert(duringScroll.isAutoScrolling === true, '应开始自动滚动')
    console.log('✓ 自动滚动启动')

    // 模拟用户滚动打断
    container.scrollTop = 100
    setTimeout(() => {
      const afterInterrupt = scrollHelper.getState()
      console.assert(afterInterrupt.isInterrupted === true, '用户滚动后应被打断')
      console.log('✓ 打断检测成功')

      // 清理
      scrollHelper.destroy()
      behaviorTracker.destroy()
      document.body.removeChild(container)
      console.log('=== 滚动助手测试完成 ===\n')
    }, 100)
  }, 100)
}

/**
 * 运行所有测试
 */
export function runAllTests(): void {
  console.log('\n========== 开始运行所有测试 ==========\n')
  
  testSpeedController()
  
  // 异步测试需要等待
  setTimeout(() => {
    testBehaviorTracker()
    
    setTimeout(() => {
      testScrollHelper()
      
      console.log('\n========== 所有测试完成 ==========\n')
    }, 300)
  }, 300)
}
