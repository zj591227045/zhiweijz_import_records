<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="32" color="#409EFF">
            <DocumentCopy />
          </el-icon>
          <h1>记账数据导入工具</h1>
        </div>
        
        <!-- 顶部菜单按钮 -->
        <div class="header-menu">
          <el-button 
            type="text" 
            @click="showTemplateDialog = true"
            class="menu-button"
          >
            <el-icon><Download /></el-icon>
            <span>下载模板</span>
          </el-button>
          
          <el-button 
            type="text" 
            @click="showHelpDialog = true"
            class="menu-button"
          >
            <el-icon><Document /></el-icon>
            <span>帮助文档</span>
          </el-button>
          
          <el-button 
            type="text" 
            @click="openSettings"
            class="menu-button"
          >
            <el-icon><Setting /></el-icon>
            <span>高级设置</span>
          </el-button>
        </div>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 欢迎区域 -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h2>欢迎使用导入工具</h2>
          <p class="description">
            支持从其他记账应用导入数据到只为记账系统
          </p>
          
          <div class="features-grid">
            <div class="feature-item">
              <el-icon color="#67C23A"><Check /></el-icon>
              <span>支持 Excel、CSV 格式</span>
            </div>
            <div class="feature-item">
              <el-icon color="#67C23A"><Check /></el-icon>
              <span>智能分类匹配</span>
            </div>
            <div class="feature-item">
              <el-icon color="#67C23A"><Check /></el-icon>
              <span>数据预览与编辑</span>
            </div>
            <div class="feature-item">
              <el-icon color="#67C23A"><Check /></el-icon>
              <span>批量导入处理</span>
            </div>
          </div>
          
          <el-button 
            type="primary" 
            size="large" 
            @click="startImport"
            class="start-button"
          >
            开始导入
          </el-button>
        </div>
      </section>
    </main>

    <!-- 模板下载弹窗 -->
    <TemplateDownload v-model="showTemplateDialog" />

    <!-- 帮助文档弹窗 -->
    <HelpDialog v-model="showHelpDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy,
  Download,
  Document,
  Setting,
  Check
} from '@element-plus/icons-vue'
import TemplateDownload from '../components/file-upload/TemplateDownload.vue'
import HelpDialog from '../components/help/HelpDialog.vue'

const router = useRouter()

// 状态
const showTemplateDialog = ref(false)
const showHelpDialog = ref(false)

const startImport = () => {
  router.push('/import')
}

const openSettings = () => {
  ElMessage.info('高级设置开发中')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 顶部导航 */
.page-header {
  width: 100%;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  width: 100%;
  height: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo h1 {
  margin: 0;
  color: #409EFF;
  font-size: 28px;
  font-weight: 600;
}

/* 顶部菜单按钮 */
.header-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #606266;
  font-size: 14px;
  transition: all 0.3s ease;
}

.menu-button:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.menu-button .el-icon {
  font-size: 16px;
}

/* 主要内容 */
.main-content {
  width: 100%;
  padding: 0;
}

/* 欢迎区域 */
.welcome-section {
  width: 100%;
  padding: 80px 0;
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  width: 100%;
  max-width: 1000px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 80px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  margin: 0 20px;
}

.welcome-content h2 {
  color: #303133;
  font-size: 48px;
  margin-bottom: 24px;
  font-weight: 700;
}

.description {
  color: #606266;
  font-size: 20px;
  margin-bottom: 50px;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #606266;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.start-button {
  padding: 18px 48px;
  font-size: 18px;
  border-radius: 12px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1023px) {
  .header-content {
    padding: 0 20px;
  }
  
  .welcome-section {
    padding: 60px 20px;
  }
  
  .welcome-content {
    padding: 60px 30px;
    margin: 0;
  }
  
  .welcome-content h2 {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .logo h1 {
    font-size: 24px;
  }
  
  .header-menu {
    gap: 4px;
  }
  
  .menu-button {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .menu-button span {
    display: none;
  }
  
  .welcome-section {
    padding: 40px 20px;
  }
  
  .welcome-content {
    padding: 40px 30px;
  }
  
  .welcome-content h2 {
    font-size: 32px;
  }
  
  .description {
    font-size: 18px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .logo h1 {
    font-size: 20px;
  }
  
  .menu-button {
    padding: 6px 8px;
  }
  
  .welcome-content h2 {
    font-size: 28px;
  }
  
  .description {
    font-size: 16px;
  }
  
  .start-button {
    width: 100%;
    padding: 16px 32px;
    font-size: 16px;
  }
}
</style> 