<template>
  <div class="examples-container">
    <!-- 头部 -->
    <header class="examples-header">
      <h1 class="examples-title">AI Stream Scroll 插件示例</h1>
      <p class="examples-subtitle">智能随读滚动插件演示</p>
    </header>

    <!-- 导航标签 -->
    <nav class="examples-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="nav-tab"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.name }}
      </button>
    </nav>

    <!-- 内容区域 -->
    <main class="examples-content">
      <BasicDemo v-if="activeTab === 'basic'" />
      <CustomConfigDemo v-if="activeTab === 'custom'" />
      <BehaviorDemo v-if="activeTab === 'behavior'" />
      <CacheDemo v-if="activeTab === 'cache'" />
    </main>

    <!-- 页脚 -->
    <footer class="examples-footer">
      <p>AI Stream Scroll Plugin · Vue3 + TypeScript</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BasicDemo from './BasicDemo.vue'
import CustomConfigDemo from './CustomConfigDemo.vue'
import BehaviorDemo from './BehaviorDemo.vue'
import CacheDemo from './CacheDemo.vue'

const activeTab = ref('basic')

const tabs = [
  { id: 'basic', name: '基础用法' },
  { id: 'custom', name: '自定义配置' },
  { id: 'behavior', name: '行为调速' },
  { id: 'cache', name: '本地缓存' }
]
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}

.examples-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.examples-header {
  text-align: center;
  margin-bottom: 32px;
}

.examples-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.examples-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.examples-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.nav-tab {
  padding: 10px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-tab:hover {
  background: #f3f4f6;
}

.nav-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.examples-content {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
}

.examples-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.examples-footer p {
  font-size: 12px;
  color: #9ca3af;
}

@media (max-width: 640px) {
  .examples-container {
    padding: 16px;
  }
  
  .examples-title {
    font-size: 24px;
  }
}
</style>
