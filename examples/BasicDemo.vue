<template>
  <div class="demo-section">
    <h2 class="demo-title">基础用法</h2>
    <p class="demo-description">默认配置，展示流式输出和智能滚动的基础功能</p>
    
    <AiStreamScroll 
      height="400px"
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
</style>
