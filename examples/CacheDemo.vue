<template>
  <div class="demo-section">
    <h2 class="demo-title">本地缓存演示</h2>
    <p class="demo-description">演示本地缓存功能。调整滚动速度后刷新页面，速度配置会自动保留</p>
    
    <div class="demo-hints">
      <div class="hint-item">
        <span class="hint-icon">💾</span>
        <span class="hint-text">速度配置自动保存到 localStorage</span>
      </div>
      <div class="hint-item">
        <span class="hint-icon">🔄</span>
        <span class="hint-text">刷新页面后自动恢复配置</span>
      </div>
      <div class="hint-item">
        <span class="hint-icon">🔑</span>
        <span class="hint-text">按 cacheKey 隔离不同用户配置</span>
      </div>
    </div>
    
    <button 
      @click="clearCache"
      class="clear-cache-btn"
    >
      🗑️ 清除缓存
    </button>
    
    <AiStreamScroll 
      height="450px"
      :enable-local-cache="true"
      cache-key="demo-cache-key"
    />
  </div>
</template>

<script setup lang="ts">
import { AiStreamScroll } from '../src'
import '../src/styles/index.css'

const clearCache = () => {
  localStorage.removeItem('demo-cache-key')
  localStorage.removeItem('ai-stream-scroll-speed')
  alert('缓存已清除！刷新页面查看效果')
}
</script>

<style scoped>
.demo-section {
  margin-bottom: 32px;
}

.demo-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.demo-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.demo-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 8px;
}

.hint-icon {
  font-size: 14px;
}

.hint-text {
  font-size: 13px;
  color: #4b5563;
}

.clear-cache-btn {
  padding: 8px 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.clear-cache-btn:hover {
  background: #fde68a;
}
</style>
