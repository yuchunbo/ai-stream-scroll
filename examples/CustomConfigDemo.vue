<template>
  <div class="demo-section">
    <h2 class="demo-title">自定义配置</h2>
    <p class="demo-description">自定义高度、速度，关闭行为调速</p>
    
    <AiStreamScroll 
      height="500px"
      :mock-speed="60"
      :base-speed="600"
      :trigger-percent="90"
      :enable-behavior-adjust="false"
      :paragraph-pause-duration="600"
      placeholder="自定义配置演示：更高的基准速度，90%触发滚动，段落暂停0.6秒"
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
