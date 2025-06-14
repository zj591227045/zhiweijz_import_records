<script setup lang="ts">
// 无需额外的逻辑，让各页面自行处理
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* 全局样式重置和基础设置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* 强制覆盖任何可能影响body布局的样式 */
body {
  display: block !important;
  place-items: unset !important;
  justify-content: unset !important;
  align-items: unset !important;
  flex-direction: unset !important;
  margin: 0 !important;
}

/* 确保在所有断点下body都使用正确的布局 */
@media (min-width: 1024px) {
  body {
    display: block !important;
    place-items: unset !important;
    justify-content: unset !important;
    align-items: unset !important;
    flex-direction: unset !important;
  }
}

#app {
  width: 100% !important;
  min-height: 100vh;
  line-height: 1.6;
  color: #2c3e50;
  display: block !important;
  max-width: none !important;
}

/* 确保在所有断点下#app都正确显示 */
@media (min-width: 1024px) {
  #app {
    width: 100% !important;
    display: block !important;
    max-width: none !important;
    place-items: unset !important;
    justify-content: unset !important;
    align-items: unset !important;
  }
}

/* 移除所有Element Plus默认的最大宽度限制 */
.el-container {
  width: 100% !important;
  max-width: none !important;
}

.el-header {
  width: 100% !important;
  max-width: none !important;
}

.el-main {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
}

/* 确保所有内容区域都能充分利用屏幕宽度 */
.page-content {
  width: 100%;
  max-width: none;
}

/* 移除Element Plus组件的默认边距和宽度限制 */
.el-card {
  width: 100%;
}

.el-row {
  width: 100%;
}

.el-col {
  width: 100%;
}

/* 全局响应式断点 */
@media (min-width: 1920px) {
  /* 超宽屏 */
  body {
    font-size: 16px;
  }
}

@media (max-width: 1200px) {
  /* 中等屏幕 */
  body {
    font-size: 15px;
  }
}

@media (max-width: 768px) {
  /* 小屏幕 */
  body {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  /* 超小屏幕 */
  body {
    font-size: 13px;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保表格和其他组件也能充分利用宽度 */
.el-table {
  width: 100% !important;
}

.el-form {
  width: 100%;
}

/* 全局动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 全局文本选择 */
::selection {
  background-color: #409EFF;
  color: white;
}
</style>
