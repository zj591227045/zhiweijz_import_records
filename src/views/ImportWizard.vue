<template>
  <div class="import-wizard">
    <!-- 页面头部 -->
    <header class="wizard-header">
      <div class="header-content">
        <div class="header-left">
          <h1>
            <el-icon><Upload /></el-icon>
            导入向导
          </h1>
          <p>通过简单的步骤将您的交易数据导入到账本中</p>
        </div>
        <div class="header-right">
          <el-button 
            v-if="currentUser" 
            @click="handleLogout" 
            size="large"
            type="danger"
            plain
          >
            <el-icon><Switch /></el-icon>
            登出 ({{ currentUser.name }})
          </el-button>
          
          <el-button @click="goHome" size="large">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
        </div>
      </div>
    </header>

    <!-- 进度指示器 -->
    <section class="progress-section">
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        
        <div class="step-indicators">
          <div 
            v-for="(step, index) in stepInfo" 
            :key="index"
            class="step-indicator"
            :class="{ 
              'active': currentStep === index + 1,
              'completed': currentStep > index + 1
            }"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-title">{{ step.title }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 主要内容区域 -->
    <main class="wizard-content">
      <div class="content-container">
        <!-- 第一步：服务配置 -->
        <div v-if="currentStep === 1" class="step-content">
          <ServerConfigForm 
            @next="handleNext"
            @prev="handlePrev"
          />
        </div>

        <!-- 第二步：文件处理 -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="step-tabs">
            <el-tabs v-model="fileStepTab" @tab-change="handleTabChange">
              <el-tab-pane label="上传文件" name="upload">
                <FileUploader @next="handleNext" @prev="handlePrev" />
              </el-tab-pane>
              
              <el-tab-pane label="分类映射" name="mapping" :disabled="!canShowMapping">
                <CategoryMapper 
                  v-if="parseResult?.success"
                  @next="handleTabNext" 
                  @prev="handlePrev"
                />
                <div v-else class="disabled-content">
                  <el-empty description="请先上传并解析文件">
                    <el-button @click="fileStepTab = 'upload'">返回上传</el-button>
                  </el-empty>
                </div>
              </el-tab-pane>
              
              <!-- 暂时跳过成员映射 -->
              <!--
              <el-tab-pane label="成员映射" name="members" :disabled="!canShowMembers">
                <MemberMapper 
                  v-if="parseResult?.success"
                  @next="handleTabNext" 
                  @prev="handleTabPrev"
                  @skip="handleTabNext"
                />
                <div v-else class="disabled-content">
                  <el-empty description="请先完成分类映射">
                    <el-button @click="fileStepTab = 'mapping'">返回分类映射</el-button>
                  </el-empty>
                </div>
              </el-tab-pane>
              -->
              
              <el-tab-pane label="数据预览" name="preview" :disabled="!canShowPreview">
                <DataPreview 
                  v-if="parseResult?.success && categoryMapping"
                  @next="handleNext" 
                  @prev="handlePrev"
                />
                <div v-else class="disabled-content">
                  <el-empty description="请先完成文件上传和分类映射">
                    <el-button @click="fileStepTab = 'upload'">返回上传</el-button>
                  </el-empty>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 第三步：数据导入 -->
        <div v-if="currentStep === 3" class="step-content">
          <ImportProgress @next="handleNext" @prev="handlePrev" />
        </div>

        <!-- 第四步：导入报告 -->
        <div v-if="currentStep === 4" class="step-content">
          <ImportReport @restart="handleRestart" @go-home="goHome" />
        </div>
      </div>
    </main>

    <!-- 底部导航 -->
    <footer class="wizard-footer" v-if="currentStep < 4">
      <div class="footer-content">
        <div class="step-info">
          <span class="current-step">第 {{ currentStep }} 步</span>
          <span class="total-steps">共 {{ totalSteps }} 步</span>
        </div>
        
        <div class="navigation-buttons">
          <el-button 
            size="large"
            @click="handlePrev"
            :disabled="!canGoPrev || isLoading"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一步
          </el-button>
          
          <el-button 
            type="primary" 
            size="large"
            @click="handleNext"
            :disabled="!canGoNext || isLoading"
            :loading="isLoading"
          >
            下一步
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </footer>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :show-icon="true"
      :closable="true"
      @close="clearError"
      class="error-alert"
    />

    <!-- 加载遮罩 (第三步不显示，因为ImportProgress组件有自己的状态显示) -->
    <div v-if="isLoading && currentStep !== 3" class="loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-icon" size="48">
          <Loading />
        </el-icon>
        <div class="loading-text">{{ loadingText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  ArrowLeft,
  ArrowRight,
  Loading,
  Switch
} from '@element-plus/icons-vue'
import { useImportStore } from '../stores/import'

// 组件导入
import ServerConfigForm from '../components/server-config/ServerConfigForm.vue'
import FileUploader from '../components/file-upload/FileUploader.vue'
import CategoryMapper from '../components/category-mapping/CategoryMapper.vue'
// import MemberMapper from '../components/category-mapping/MemberMapper.vue' // 暂时跳过
import DataPreview from '../components/data-preview/DataPreview.vue'
import ImportProgress from '../components/import-progress/ImportProgress.vue'
import ImportReport from '../components/import-report/ImportReport.vue'

// Router
const router = useRouter()

// Store
const importStore = useImportStore()

// 状态
const fileStepTab = ref('upload')

// 计算属性
const currentStep = computed(() => importStore.currentStep)
const totalSteps = computed(() => importStore.totalSteps)
const stepInfo = computed(() => importStore.stepInfo)
const progressPercentage = computed(() => importStore.progressPercentage)
const canGoNext = computed(() => importStore.canGoNext)
const canGoPrev = computed(() => importStore.canGoPrev)
const isLoading = computed(() => importStore.isLoading)
const error = computed(() => importStore.error)
const parseResult = computed(() => importStore.parseResult)
const categoryMapping = computed(() => importStore.categoryMapping)
const currentUser = computed(() => importStore.currentUser)

// 文件步骤相关
const canShowMapping = computed(() => {
  return parseResult.value?.success === true
})

// 暂时跳过成员映射相关逻辑
// const canShowMembers = computed(() => {
//   return parseResult.value?.success === true && 
//          categoryMapping.value !== null
// })

const canShowPreview = computed(() => {
  return parseResult.value?.success === true && 
         categoryMapping.value !== null
  // 暂时跳过成员/预算映射验证
  // && (categoryMapping.value?.memberMappings !== undefined || !hasMembers.value)
})

// 暂时跳过成员映射相关逻辑
// const hasMembers = computed(() => {
//   const data = parseResult.value?.data || []
//   return data.some((record: any) => record.member)
// })

const loadingText = computed(() => {
  switch (currentStep.value) {
    case 1:
      return '正在连接服务器...'
    case 2:
      return '正在处理文件...'
    case 3:
      // 在第三步时，根据导入进度的具体状态显示不同文本
      if (importStore.importProgress?.status === 'undoing') {
        return '正在撤销导入...'
      } else if (importStore.importProgress?.status === 'importing') {
        return '正在导入数据...'
      } else if (importStore.importProgress?.status === 'preparing') {
        return '正在准备导入...'
      } else {
        return '正在导入数据...'
      }
    default:
      return '处理中...'
  }
})

// 方法
const handleNext = () => {
  // 在第二步时，检查子步骤完成情况
  if (currentStep.value === 2) {
    if (fileStepTab.value === 'upload' && canShowMapping.value) {
      fileStepTab.value = 'mapping'
      return
    } else if (fileStepTab.value === 'mapping' && canShowPreview.value) {
      // 跳过成员映射，直接到预览
      fileStepTab.value = 'preview'
      return
    } else if (fileStepTab.value === 'preview' && canGoNext.value) {
      importStore.nextStep()
      return
    }
  }
  
  importStore.nextStep()
}

// 处理标签页内的导航
const handleTabNext = () => {
  if (fileStepTab.value === 'mapping' && canShowPreview.value) {
    // 跳过成员映射，直接到预览
    fileStepTab.value = 'preview'
  } else if (fileStepTab.value === 'preview' && canGoNext.value) {
    importStore.nextStep()
  }
  // 暂时注释掉成员映射逻辑
  // if (fileStepTab.value === 'mapping' && canShowMembers.value) {
  //   fileStepTab.value = 'members'
  // } else if (fileStepTab.value === 'members' && canShowPreview.value) {
  //   fileStepTab.value = 'preview'
  // } else if (fileStepTab.value === 'preview' && canGoNext.value) {
  //   importStore.nextStep()
  // }
}

const handleTabPrev = () => {
  // 暂时跳过成员映射逻辑
  if (fileStepTab.value === 'preview') {
    fileStepTab.value = 'mapping'
  }
  // if (fileStepTab.value === 'members') {
  //   fileStepTab.value = 'mapping'
  // } else if (fileStepTab.value === 'preview') {
  //   fileStepTab.value = hasMembers.value ? 'members' : 'mapping'
  // }
}

const handlePrev = () => {
  // 在第二步时，处理子步骤后退
  if (currentStep.value === 2) {
    if (fileStepTab.value === 'preview') {
      // 暂时跳过成员映射，直接回到分类映射
      fileStepTab.value = 'mapping'
      return
    } else if (fileStepTab.value === 'mapping') {
      fileStepTab.value = 'upload'
      return
    } else if (fileStepTab.value === 'upload') {
      importStore.prevStep()
      return
    }
  }
  
  importStore.prevStep()
}

const handleTabChange = (tabName: string) => {
  // 防止手动切换到未解锁的标签页
  if (tabName === 'mapping' && !canShowMapping.value) {
    fileStepTab.value = 'upload'
    ElMessage.warning('请先上传并解析文件')
    return
  }
  
  // 暂时跳过成员映射相关检查
  // if (tabName === 'members' && !canShowMembers.value) {
  //   fileStepTab.value = canShowMapping.value ? 'mapping' : 'upload'
  //   ElMessage.warning('请先完成分类映射')
  //   return
  // }
  
  if (tabName === 'preview' && !canShowPreview.value) {
    // 暂时跳过成员映射，直接检查分类映射
    if (canShowMapping.value) {
      fileStepTab.value = 'mapping'
    } else {
      fileStepTab.value = 'upload'
    }
    ElMessage.warning('请先完成前面的步骤')
    return
  }
}

const handleRestart = () => {
  importStore.reset()
  fileStepTab.value = 'upload'
  ElMessage.success('已重置导入流程')
}

const goHome = () => {
  router.push('/')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要登出吗？这将清除所有已保存的状态。',
      '确认登出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await importStore.logout()
    ElMessage.success('已成功登出')
    
    // 重置到第一步
    importStore.goToStep(1)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('登出失败')
      console.error('登出错误:', error)
    }
  }
}

const clearError = () => {
  importStore.error = ''
}

// 监听步骤变化
watch(currentStep, (newStep) => {
  // 进入第二步时重置标签页
  if (newStep === 2) {
    fileStepTab.value = 'upload'
  }
})

// 生命周期
onMounted(async () => {
  // 尝试恢复登录状态
  try {
    const restored = await importStore.restoreLoginState()
    if (restored) {
      ElMessage.success('欢迎回来！已自动恢复登录状态')
    }
  } catch (error) {
    console.warn('恢复登录状态失败:', error)
  }
})
</script>

<style scoped>
.import-wizard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

/* 页面头部 */
.wizard-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem 0;
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.875rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

/* 进度指示器 */
.progress-section {
  padding: 0.25rem 0;
}

.progress-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.progress-bar {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.5s ease;
  border-radius: 2px;
}

.step-indicators {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  max-height: 40px;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  height: 36px;
}

.step-indicator.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.step-indicator.completed {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.step-number {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.step-indicator.active .step-number {
  background: rgba(59, 130, 246, 0.8);
}

.step-indicator.completed .step-number {
  background: rgba(16, 185, 129, 0.8);
}

.step-title {
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-indicator.active .step-title {
  color: white;
  font-weight: 700;
}

.step-indicator.completed .step-title {
  color: rgba(16, 185, 129, 1);
}

.step-content {
  flex: 1;
  overflow: hidden;
}

/* 主要内容 */
.wizard-content {
  padding: 1rem 0 6rem 0;
}

.content-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.step-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 500px;
  overflow: hidden;
}

/* 文件步骤标签 */
.step-tabs {
  height: 100%;
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
}

:deep(.el-tab-pane) {
  height: 100%;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: rgba(249, 250, 251, 0.8);
  padding: 0 2rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

:deep(.el-tabs__nav-wrap) {
  padding: 1rem 0;
}

:deep(.el-tabs__item) {
  font-weight: 500;
  font-size: 1rem;
  padding: 0 2rem;
  height: 44px;
  line-height: 44px;
}

.disabled-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  padding: 2rem;
}

/* 底部导航 */
.wizard-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  padding: 1.5rem 0;
  z-index: 100;
}

.footer-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.current-step {
  font-weight: 600;
  color: #374151;
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
}

/* 错误提示 */
.error-alert {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: 500px;
  width: 90%;
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.loading-icon {
  color: #3b82f6;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #374151;
  font-size: 1.125rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .step-indicators {
    grid-template-columns: repeat(2, 1fr);
    max-height: 80px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .step-indicators {
    grid-template-columns: 1fr;
    max-height: 160px;
  }
  
  .step-indicator {
    height: 32px;
    padding: 0.25rem;
  }
  
  .content-container,
  .header-content,
  .progress-container,
  .footer-content {
    padding: 0 1rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .navigation-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .navigation-buttons .el-button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .wizard-content {
    padding: 0.5rem 0 7rem 0;
  }
  
  .progress-section {
    padding: 0.125rem 0;
  }
  
  .progress-bar {
    margin-bottom: 0.25rem;
  }
  
  .step-content {
    border-radius: 8px;
    min-height: 400px;
  }
  
  .step-indicator {
    height: 28px;
    padding: 0.125rem;
  }
  
  .step-number {
    width: 16px;
    height: 16px;
    font-size: 0.65rem;
  }
  
  .step-title {
    font-size: 0.65rem;
  }
  
  :deep(.el-tabs__header) {
    padding: 0 1rem;
  }
  
  :deep(.el-tabs__item) {
    padding: 0 1rem;
    font-size: 0.875rem;
  }
}
</style> 