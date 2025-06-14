<template>
  <div class="import-report">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="24" color="#409EFF">
            <DocumentCopy />
          </el-icon>
          <span>导入报告</span>
        </div>
        <div class="nav-buttons">
          <el-button type="text" @click="goToImport" class="nav-button">
            <el-icon><Refresh /></el-icon>
            重新导入
          </el-button>
          <el-button type="text" @click="goHome" class="nav-button">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
        </div>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 报告标题区域 -->
      <section class="title-section">
        <div class="title-content">
          <el-icon size="64" color="#67C23A"><CircleCheck /></el-icon>
          <h1>导入完成</h1>
          <p>数据导入处理已完成，以下是详细统计信息</p>
        </div>
      </section>
      
      <!-- 统计卡片区域 -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card success">
            <div class="stat-icon">
              <el-icon size="40" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="stat-content">
              <h3>成功导入</h3>
              <div class="stat-number">{{ mockData.success }}</div>
              <p>条记录已成功导入</p>
            </div>
          </div>
          
          <div class="stat-card error">
            <div class="stat-icon">
              <el-icon size="40" color="#F56C6C"><Close /></el-icon>
            </div>
            <div class="stat-content">
              <h3>导入失败</h3>
              <div class="stat-number">{{ mockData.failed }}</div>
              <p>条记录导入失败</p>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon size="40" color="#E6A23C"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <h3>重复数据</h3>
              <div class="stat-number">{{ mockData.duplicated }}</div>
              <p>条重复记录已跳过</p>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">
              <el-icon size="40" color="#409EFF"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <h3>总计记录</h3>
              <div class="stat-number">{{ mockData.total }}</div>
              <p>条记录已处理</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 详细信息区域 -->
      <section class="details-section">
        <div class="details-container">
          <!-- 错误详情 -->
          <div class="detail-card" v-if="mockData.errors.length > 0">
            <div class="card-header">
              <el-icon color="#F56C6C"><Warning /></el-icon>
              <h3>错误详情</h3>
            </div>
            <div class="card-content">
              <div class="error-list">
                <div 
                  v-for="(error, index) in mockData.errors" 
                  :key="index"
                  class="error-item"
                >
                  <div class="error-row">第 {{ error.row }} 行</div>
                  <div class="error-message">{{ error.message }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 重复数据详情 -->
          <div class="detail-card" v-if="mockData.duplicates.length > 0">
            <div class="card-header">
              <el-icon color="#E6A23C"><Warning /></el-icon>
              <h3>重复数据</h3>
            </div>
            <div class="card-content">
              <div class="duplicate-list">
                <div 
                  v-for="(duplicate, index) in mockData.duplicates" 
                  :key="index"
                  class="duplicate-item"
                >
                  <div class="duplicate-date">{{ duplicate.date }}</div>
                  <div class="duplicate-amount">{{ duplicate.amount }}</div>
                  <div class="duplicate-description">{{ duplicate.description }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 处理时间信息 -->
          <div class="detail-card">
            <div class="card-header">
              <el-icon color="#409EFF"><Clock /></el-icon>
              <h3>处理信息</h3>
            </div>
            <div class="card-content">
              <div class="process-info">
                <div class="info-item">
                  <span class="info-label">开始时间:</span>
                  <span class="info-value">{{ mockData.startTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">结束时间:</span>
                  <span class="info-value">{{ mockData.endTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">处理耗时:</span>
                  <span class="info-value">{{ mockData.duration }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">文件大小:</span>
                  <span class="info-value">{{ mockData.fileSize }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 操作按钮区域 -->
      <section class="actions-section">
        <div class="actions-container">
          <el-button size="large" @click="downloadReport" class="action-button">
            <el-icon><Download /></el-icon>
            下载报告
          </el-button>
          
          <el-button type="primary" size="large" @click="goToImport" class="action-button">
            <el-icon><Refresh /></el-icon>
            重新导入
          </el-button>
          
          <el-button type="success" size="large" @click="goHome" class="action-button">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 模拟导入报告数据
const mockData = ref({
  success: 1856,
  failed: 24,
  duplicated: 35,
  total: 1915,
  startTime: '2024-01-15 14:30:25',
  endTime: '2024-01-15 14:32:18',
  duration: '1分53秒',
  fileSize: '2.5 MB',
  errors: [
    { row: 156, message: '日期格式不正确，应为 YYYY-MM-DD' },
    { row: 278, message: '金额字段不能为空' },
    { row: 342, message: '分类信息无法匹配' },
    { row: 456, message: '描述信息过长，超过100字符限制' }
  ],
  duplicates: [
    { date: '2024-01-10', amount: '￥1,280.00', description: '超市购物' },
    { date: '2024-01-12', amount: '￥520.00', description: '餐厅消费' },
    { date: '2024-01-14', amount: '￥3,200.00', description: '房租支付' }
  ]
})

const goHome = () => {
  router.push('/')
}

const goToImport = () => {
  router.push('/import')
}

const downloadReport = () => {
  ElMessage.success('报告下载功能开发中')
}
</script>

<style scoped>
.import-report {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
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
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.nav-buttons {
  display: flex;
  gap: 16px;
}

.nav-button {
  font-size: 16px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-button:hover {
  color: #409EFF;
}

/* 主要内容 */
.main-content {
  width: 100%;
  padding: 0;
}

/* 标题区域 */
.title-section {
  width: 100%;
  padding: 80px 20px;
  text-align: center;
}

.title-content h1 {
  margin: 20px 0 16px 0;
  color: #303133;
  font-size: 48px;
  font-weight: 700;
}

.title-content p {
  color: #606266;
  margin: 0;
  font-size: 20px;
}

/* 统计卡片区域 */
.stats-section {
  width: 100%;
  padding: 0 20px 60px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  width: 100%;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--card-color), var(--card-color-light));
}

.stat-card.success {
  --card-color: #67C23A;
  --card-color-light: #95D475;
}

.stat-card.error {
  --card-color: #F56C6C;
  --card-color-light: #F89898;
}

.stat-card.warning {
  --card-color: #E6A23C;
  --card-color-light: #EDB563;
}

.stat-card.info {
  --card-color: #409EFF;
  --card-color-light: #66B1FF;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  margin-bottom: 20px;
}

.stat-content h3 {
  color: #303133;
  font-size: 18px;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.stat-number {
  color: var(--card-color);
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1;
}

.stat-content p {
  color: #606266;
  margin: 0;
  font-size: 14px;
}

/* 详细信息区域 */
.details-section {
  width: 100%;
  padding: 0 20px 60px;
}

.details-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  width: 100%;
}

.detail-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f5f7fa;
}

.card-header h3 {
  color: #303133;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.card-content {
  color: #606266;
}

.error-list, .duplicate-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 12px;
  border-left: 4px solid #F56C6C;
}

.error-row {
  color: #F56C6C;
  font-weight: 600;
  min-width: 80px;
}

.error-message {
  color: #606266;
  flex: 1;
}

.duplicate-item {
  display: grid;
  grid-template-columns: 120px 120px 1fr;
  gap: 16px;
  padding: 16px;
  background: rgba(230, 162, 60, 0.1);
  border-radius: 12px;
  border-left: 4px solid #E6A23C;
}

.duplicate-date {
  color: #E6A23C;
  font-weight: 600;
}

.duplicate-amount {
  color: #303133;
  font-weight: 600;
}

.duplicate-description {
  color: #606266;
}

.process-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-weight: 500;
}

.info-value {
  color: #303133;
  font-weight: 600;
}

/* 操作按钮区域 */
.actions-section {
  width: 100%;
  padding: 40px 10px 80px;
  display: flex;
  justify-content: center;
}

.actions-container {
  display: flex;
  gap: 24px;
  align-items: center;
}

.action-button {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (min-width: 1024px) {
  .header-content {
    padding: 0 20px;
  }
  
  .title-section {
    padding: 80px 20px;
  }
  
  .title-content h1 {
    font-size: 48px;
  }
  
  .stats-section {
    padding: 0 20px 60px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 30px;
  }
  
  .details-section {
    padding: 0 20px 60px;
  }
  
  .details-container {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
  }
  
  .actions-section {
    padding: 40px 10px 80px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .nav-buttons {
    gap: 12px;
  }
  
  .nav-button {
    font-size: 14px;
  }
  
  .title-section {
    padding: 40px 20px;
  }
  
  .title-content h1 {
    font-size: 32px;
  }
  
  .title-content p {
    font-size: 18px;
  }
  
  .stats-section {
    padding: 0 20px 40px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .stat-card {
    padding: 30px 20px;
  }
  
  .stat-number {
    font-size: 36px;
  }
  
  .details-section {
    padding: 0 20px 40px;
  }
  
  .details-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .detail-card {
    padding: 24px;
  }
  
  .duplicate-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .actions-section {
    padding: 20px 20px 40px;
  }
  
  .actions-container {
    gap: 16px;
  }
  
  .action-button {
    padding: 14px 24px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .title-content h1 {
    font-size: 28px;
  }
  
  .title-content p {
    font-size: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-container {
    flex-direction: column;
    width: 100%;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 