<template>
  <div class="demo-section">
    <h2 class="demo-title">行为调速演示</h2>
    <p class="demo-description">演示行为统计与自动调速功能。尝试：选中文字（精读）、快速下滑（追更）、上滑回看（减速）</p>
    
    <div class="demo-hints">
      <div class="hint-item">
        <span class="hint-icon">📖</span>
        <span class="hint-text">选中文字或长时间停留 → 速度减慢</span>
      </div>
      <div class="hint-item">
        <span class="hint-icon">⬇️</span>
        <span class="hint-text">频繁向下滚动 → 速度加快</span>
      </div>
      <div class="hint-item">
        <span class="hint-icon">⬆️</span>
        <span class="hint-text">向上滚动回看 → 速度减慢</span>
      </div>
    </div>
    
    <AiStreamScroll 
      height="450px"
      :mock-speed="30"
      :base-speed="300"
      :enable-behavior-adjust="true"
    />
  </div>
</template>

<script setup lang="ts">
import { AiStreamScroll } from '../src'
import '../src/styles/index.css'
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
</style>
