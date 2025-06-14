<template>
  <div class="server-config-form">
    <!-- 步骤指示器 -->
    <div class="sub-step-indicator">
      <div 
        v-for="(subStep, index) in subSteps" 
        :key="index"
        class="sub-step-item"
        :class="{ 
          'active': currentSubStep === index + 1,
          'completed': currentSubStep > index + 1
        }"
      >
        <div class="sub-step-number">{{ index + 1 }}</div>
        <div class="sub-step-title">{{ subStep.title }}</div>
      </div>
    </div>

    <!-- 子步骤内容 -->
    <div class="sub-step-content">
      <!-- 第一子步：配置API服务器 -->
      <div v-if="currentSubStep === 1" class="config-step">
        <!-- 服务器类型选择选项卡 -->
        <el-tabs v-model="serverType" class="server-tabs" @tab-change="handleServerTypeChange">
          <el-tab-pane label="官方服务器" name="official">
            <div class="server-option">
              <div class="option-header">
                <el-icon color="#67C23A"><Check /></el-icon>
                <h4>使用官方服务器</h4>
              </div>
              <p class="option-description">
                使用只为记账官方提供的服务器，稳定可靠，无需额外配置。
              </p>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="自定义服务器" name="custom">
            <div class="server-option">
              <div class="option-header">
                <el-icon color="#409EFF"><Setting /></el-icon>
                <h4>自定义服务器</h4>
              </div>
              <p class="option-description">
                使用您自己部署的服务器或其他第三方服务器。
              </p>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 自定义服务器配置表单 -->
        <div v-if="serverType === 'custom'" class="custom-server-config">
          <el-form 
            ref="serverFormRef"
            :model="customServerForm" 
            :rules="serverRules"
            label-width="120px"
            class="custom-server-form"
          >
            <el-form-item label="服务器地址" prop="baseURL">
              <el-input
                v-model="customServerForm.baseURL"
                placeholder="请输入服务器地址，如: https://your-server.com"
                size="large"
                :disabled="isLoading"
                @blur="handleCustomServerChange"
              >
                <template #prepend>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <div class="form-tip">
                <el-icon><InfoFilled /></el-icon>
                无需填写 /api 路径，系统会自动补全
              </div>
            </el-form-item>
            
            <el-form-item label="超时时间" prop="timeout">
              <el-input-number
                v-model="customServerForm.timeout"
                :min="5000"
                :max="60000"
                :step="1000"
                size="large"
                :disabled="isLoading"
                style="width: 100%"
                @change="handleCustomServerChange"
              />
              <div class="form-tip">请求超时时间（毫秒），建议10000-30000</div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 服务器信息显示 -->
        <div class="server-info-section">
          <el-card shadow="never" class="server-info-card">
            <div class="server-details">
              <div class="detail-item">
                <span class="label">服务器地址：</span>
                <span class="value">{{ currentServerConfig.baseURL || '未配置' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">服务状态：</span>
                <el-tag 
                  :type="healthStatus.status === 'healthy' ? 'success' : healthStatus.status === 'checking' ? 'warning' : 'danger'" 
                  size="small"
                >
                  {{ healthStatus.message }}
                </el-tag>
              </div>
              <div class="detail-item">
                <span class="label">响应时间：</span>
                <span class="value">
                  {{ healthStatus.responseTime ? `${healthStatus.responseTime}ms` : '-' }}
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 测试连接按钮 -->
        <div class="connection-actions">
          <el-button 
            type="primary" 
            size="large"
            :loading="isLoading"
            @click="testConnection"
            class="test-connection-btn"
          >
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
        </div>

        <!-- 连接状态 -->
        <div v-if="connectionStatus" class="connection-status">
          <el-alert
            :title="connectionStatus.message"
            :type="connectionStatus.type"
            :show-icon="true"
            :closable="false"
          />
        </div>
      </div>

      <!-- 第二子步：用户登录 -->
      <div v-if="currentSubStep === 2" class="login-step">
        <div class="step-header">
          <h3>用户登录</h3>
          <p>请输入您的账户信息进行身份验证</p>
        </div>

        <el-form 
          ref="loginFormRef"
          :model="loginForm" 
          :rules="loginRules"
          label-width="120px"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="loginForm.email"
              placeholder="请输入邮箱地址"
              size="large"
              :disabled="isLoading"
            >
              <template #prepend>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :disabled="isLoading"
              show-password
            >
              <template #prepend>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              size="large"
              :loading="isLoading"
              @click="handleLogin"
              style="width: 100%"
            >
              <el-icon><Key /></el-icon>
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 当前用户信息 -->
        <div v-if="currentUser" class="user-info">
          <el-card>
            <div class="user-profile">
              <el-avatar :size="50" :src="currentUser.avatar">
                {{ currentUser.name?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <h4>{{ currentUser.name }}</h4>
                <p>{{ currentUser.email }}</p>
                <el-tag size="small" type="success">已登录</el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 第三子步：选择账本 -->
      <div v-if="currentSubStep === 3" class="account-book-step">
        <div class="step-header">
          <h3>选择账本</h3>
          <p>请选择要导入数据的目标账本</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoadingAccountBooks" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <!-- 账本列表 -->
        <div v-else-if="availableAccountBooks.length > 0" class="account-book-list">
          <div 
            v-for="book in availableAccountBooks" 
            :key="book.id"
            class="account-book-item"
            :class="{ 'selected': selectedAccountBook?.id === book.id }"
            @click="selectBook(book)"
          >
            <div class="book-icon">
              <el-icon size="24"><Notebook /></el-icon>
            </div>
            <div class="book-info">
              <h4>{{ book.name }}</h4>
              <p>{{ book.description || '无描述' }}</p>
              <div class="book-meta">
                <el-tag size="small">{{ book.currency || 'CNY' }}</el-tag>
                <span class="book-updated">更新于 {{ formatDate(book.updatedAt) }}</span>
              </div>
            </div>
            <div class="book-stats">
              <div class="stat-item">
                <span class="stat-value">{{ book.transactionCount || 0 }}</span>
                <span class="stat-label">交易</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ book.categoryCount || 0 }}</span>
                <span class="stat-label">分类</span>
              </div>
            </div>
            <div class="book-select">
              <el-radio 
                :model-value="selectedAccountBook?.id" 
                :label="book.id"
                @change="selectBook(book)"
              />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="没有找到可用的账本">
            <el-button type="primary" @click="loadAccountBooks">
              刷新账本列表
            </el-button>
          </el-empty>
        </div>

        <!-- 已选择的账本信息 -->
        <div v-if="selectedAccountBook" class="selected-book-info">
          <el-alert
            :title="`已选择账本: ${selectedAccountBook.name}`"
            type="success"
            :show-icon="true"
            :closable="false"
          >
            <p>{{ selectedAccountBook.description }}</p>
            <div class="book-details">
              <el-tag size="small" type="info">
                {{ selectedAccountBook.transactionCount || 0 }} 笔交易
              </el-tag>
              <el-tag size="small" type="success" v-if="categoryStats.total > 0">
                {{ categoryStats.total }} 个分类
              </el-tag>
              <el-tag size="small" type="warning" v-if="categoryStats.income > 0">
                {{ categoryStats.income }} 个收入分类
              </el-tag>
              <el-tag size="small" type="danger" v-if="categoryStats.expense > 0">
                {{ categoryStats.expense }} 个支出分类
              </el-tag>
            </div>
          </el-alert>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="form-actions">
      <el-button 
        v-if="currentSubStep > 1"
        size="large"
        @click="prevSubStep"
        :disabled="isLoading"
      >
        上一步
      </el-button>
      
      <el-button 
        v-if="currentSubStep < 3"
        type="primary" 
        size="large"
        @click="nextSubStep"
        :disabled="!canGoNextSubStep || isLoading"
      >
        下一步
      </el-button>
      
      <el-button 
        v-if="currentSubStep === 3"
        type="success" 
        size="large"
        @click="completeConfiguration"
        :disabled="!selectedAccountBook || isLoading"
      >
        完成配置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Link, 
  Connection, 
  User, 
  Lock, 
  Key, 
  Notebook,
  Check,
  Setting,
  InfoFilled
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'
import dayjs from 'dayjs'

// Store
const importStore = useImportStore()

// 子步骤状态
const currentSubStep = ref(1)
const subSteps = [
  { title: '配置服务器' },
  { title: '用户登录' },
  { title: '选择账本' }
]

// 服务器类型选择
const serverType = ref('official')

// 官方服务器配置
const officialServerConfig = ref({
  baseURL: 'https://app.zhiweijz.cn:1443',
  timeout: 15000
})

// 自定义服务器配置表单
const serverFormRef = ref()
const customServerForm = ref({
  baseURL: '',
  timeout: 15000
})

// 当前使用的服务器配置
const currentServerConfig = computed(() => {
  return serverType.value === 'official' ? officialServerConfig.value : customServerForm.value
})

const serverRules = {
  baseURL: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+/,
      message: '请输入有效的URL地址',
      trigger: 'blur'
    }
  ],
  timeout: [
    { required: true, message: '请设置超时时间', trigger: 'blur' },
    { 
      type: 'number',
      min: 5000,
      max: 60000,
      message: '超时时间应在5-60秒之间',
      trigger: 'blur'
    }
  ]
}

// 登录表单
const loginFormRef = ref()
const loginForm = ref({
  email: '',
  password: ''
})

const loginRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 状态
const connectionStatus = ref<{
  type: 'success' | 'error' | 'warning'
  message: string
} | null>(null)

const healthStatus = ref<{
  status: 'healthy' | 'unhealthy' | 'checking' | 'unknown'
  message: string
  responseTime?: number
}>({
  status: 'unknown',
  message: '未检查'
})

const isLoadingAccountBooks = ref(false)

// 计算属性
const isLoading = computed(() => importStore.isLoading)
const currentUser = computed(() => importStore.currentUser)
const availableAccountBooks = computed(() => importStore.availableAccountBooks)
const selectedAccountBook = computed(() => importStore.selectedAccountBook)
const categoryStats = computed(() => importStore.categoryStats)

const canGoNextSubStep = computed(() => {
  switch (currentSubStep.value) {
    case 1:
      return connectionStatus.value?.type === 'success'
    case 2:
      return !!currentUser.value
    case 3:
      return !!selectedAccountBook.value
    default:
      return false
  }
})

// 方法
const testConnection = async () => {
  try {
    // 如果是自定义服务器，需要验证表单
    if (serverType.value === 'custom') {
      await serverFormRef.value?.validate()
    }
    
    connectionStatus.value = null
    await importStore.setServerConfig(currentServerConfig.value)
    
    connectionStatus.value = {
      type: 'success',
      message: '服务器连接成功！'
    }
    
    ElMessage.success('服务器连接成功')
  } catch (error) {
    connectionStatus.value = {
      type: 'error',
      message: error instanceof Error ? error.message : '连接失败'
    }
  }
}

const handleLogin = async () => {
  try {
    await loginFormRef.value?.validate()
    await importStore.login(loginForm.value)
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  }
}

const loadAccountBooks = async () => {
  try {
    isLoadingAccountBooks.value = true
    await importStore.loadAccountBooks()
  } catch (error) {
    ElMessage.error('加载账本列表失败')
  } finally {
    isLoadingAccountBooks.value = false
  }
}

const selectBook = async (book: any) => {
  try {
    await importStore.selectAccountBook(book)
    ElMessage.success(`已选择账本: ${book.name}`)
  } catch (error) {
    ElMessage.error('选择账本失败')
  }
}

const nextSubStep = () => {
  if (canGoNextSubStep.value && currentSubStep.value < 3) {
    currentSubStep.value++
    
    // 自动加载账本列表
    if (currentSubStep.value === 3 && availableAccountBooks.value.length === 0) {
      loadAccountBooks()
    }
  }
}

const prevSubStep = () => {
  if (currentSubStep.value > 1) {
    currentSubStep.value--
  }
}

const completeConfiguration = () => {
  if (selectedAccountBook.value) {
    ElMessage.success('服务配置完成')
    emit('next')
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 事件
const emit = defineEmits<{
  next: []
  prev: []
}>()

// 生命周期
// 检查服务器健康状态
const checkServerHealth = async (serverConfig: { baseURL: string; timeout: number }) => {
  console.log('开始健康检查:', serverConfig)
  
  if (!serverConfig.baseURL.trim()) {
    healthStatus.value = {
      status: 'unknown',
      message: '未配置'
    }
    return
  }
  
  healthStatus.value = {
    status: 'checking',
    message: '检查中...'
  }
  
  try {
    const startTime = Date.now()
    // 确保URL格式正确，如果没有/api路径则添加
    let healthUrl = serverConfig.baseURL
    if (!healthUrl.endsWith('/api')) {
      healthUrl = healthUrl.endsWith('/') ? `${healthUrl}api` : `${healthUrl}/api`
    }
    healthUrl = `${healthUrl}/health`
    
    console.log('健康检查URL:', healthUrl)
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(serverConfig.timeout)
    })
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    console.log('健康检查响应时间:', responseTime, 'ms')
    
    if (response.ok) {
      const data = await response.json()
      healthStatus.value = {
        status: 'healthy',
        message: data.message || '正常运行',
        responseTime
      }
      console.log('健康检查成功:', healthStatus.value)
    } else {
      healthStatus.value = {
        status: 'unhealthy',
        message: `服务器错误 (${response.status})`,
        responseTime
      }
      console.log('健康检查失败 - 服务器错误:', healthStatus.value)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '连接失败'
    healthStatus.value = {
      status: 'unhealthy',
      message: errorMessage
    }
    console.log('健康检查失败 - 异常:', healthStatus.value)
  }
}

// 处理自定义服务器配置变化
const handleCustomServerChange = () => {
  if (serverType.value === 'custom' && customServerForm.value.baseURL.trim()) {
    checkServerHealth(customServerForm.value)
  } else if (serverType.value === 'custom') {
    // 如果地址为空，重置健康状态
    healthStatus.value = {
      status: 'unknown',
      message: '未配置'
    }
  }
}

// 处理服务器类型切换
const handleServerTypeChange = (type: string) => {
  serverType.value = type
  connectionStatus.value = null
  
  // 切换服务器类型时自动检查健康状态
  const config = type === 'official' ? officialServerConfig.value : customServerForm.value
  if (config.baseURL) {
    checkServerHealth(config)
  }
}

onMounted(async () => {
  console.log('ServerConfigForm 组件初始化')
  
  // 首先尝试恢复登录状态（包括服务器配置）
  try {
    await importStore.restoreLoginState()
    console.log('恢复登录状态完成，当前服务器配置:', importStore.serverConfig)
  } catch (err) {
    console.warn('恢复登录状态失败:', err)
  }
  
  // 如果已经有配置，自动填充
  if (importStore.serverConfig) {
    const config = importStore.serverConfig
    console.log('使用已保存的服务器配置:', config)
    
    if (config.baseURL === officialServerConfig.value.baseURL) {
      serverType.value = 'official'
      console.log('设置为官方服务器')
    } else {
      serverType.value = 'custom'
      customServerForm.value = { 
        baseURL: config.baseURL,
        timeout: config.timeout || 15000
      }
      console.log('设置为自定义服务器:', customServerForm.value)
    }
    
    // 检查已配置服务器的健康状态
    const healthCheckConfig = {
      baseURL: config.baseURL,
      timeout: config.timeout || 15000
    }
    console.log('开始检查已配置服务器健康状态:', healthCheckConfig)
    await checkServerHealth(healthCheckConfig)
  } else {
    console.log('没有已保存的配置，使用官方服务器')
    // 默认检查官方服务器健康状态
    await checkServerHealth(officialServerConfig.value)
  }
  
  // 如果已经登录且有账本数据，直接跳转到账本选择
  if (importStore.currentUser && importStore.availableAccountBooks.length > 0) {
    currentSubStep.value = 3
  } else if (importStore.currentUser) {
    // 如果已登录但没有账本数据，跳转到账本选择并加载
    currentSubStep.value = 3
    loadAccountBooks()
  } else if (importStore.serverConfig) {
    // 如果有服务器配置但未登录，跳转到登录步骤
    currentSubStep.value = 2
  }
})
</script>

<style scoped>
.server-config-form {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* 子步骤指示器 */
.sub-step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
  padding: 0 1rem;
}

.sub-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.sub-step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 15px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.sub-step-item.completed:not(:last-child)::after,
.sub-step-item.active:not(:last-child)::after {
  background: #409eff;
}

.sub-step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #9ca3af;
  font-weight: 600;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;
  transition: all 0.3s;
}

.sub-step-item.active .sub-step-number {
  background: #409eff;
  color: white;
}

.sub-step-item.completed .sub-step-number {
  background: #67c23a;
  color: white;
}

.sub-step-title {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

.sub-step-item.active .sub-step-title {
  color: #409eff;
  font-weight: 600;
}

.sub-step-item.completed .sub-step-title {
  color: #67c23a;
}

/* 步骤内容 */
.sub-step-content {
  min-height: 400px;
  margin-bottom: 2rem;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.step-header p {
  margin: 0;
  color: #6b7280;
}

/* 服务器选项卡样式 */
.server-tabs {
  margin-bottom: 2rem;
}

.server-option {
  padding: 1rem 0;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.option-header h4 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.option-description {
  color: #606266;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.server-info-section {
  margin-top: 2rem;
}

.server-info-card {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
}

.server-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-item .label {
  color: #606266;
  font-weight: 500;
}

.detail-item .value {
  color: #303133;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.custom-server-config {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.custom-server-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-tip {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.connection-actions {
  text-align: center;
  margin: 2rem 0;
}

.test-connection-btn {
  min-width: 200px;
}

/* 表单样式 */
.login-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-tip {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* 连接状态 */
.connection-status {
  margin-top: 1rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* 用户信息 */
.user-info {
  max-width: 500px;
  margin: 1rem auto 0;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-details h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.user-details p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* 账本列表 */
.loading-container {
  max-width: 600px;
  margin: 0 auto;
}

.account-book-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 700px;
  margin: 0 auto;
}

.account-book-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.account-book-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.account-book-item.selected {
  border-color: #409eff;
  background: #f0f9ff;
}

.book-icon {
  color: #409eff;
}

.book-info {
  flex: 1;
}

.book-info h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.book-info p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.book-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.book-updated {
  font-size: 0.75rem;
  color: #9ca3af;
}

.book-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* 选中的账本信息 */
.selected-book-info {
  margin-top: 1rem;
}

.selected-book-info .book-details {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.selected-book-info .book-details .el-tag {
  font-size: 0.75rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 2rem;
}

/* 底部操作 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

/* 响应式 */
@media (max-width: 768px) {
  .server-config-form {
    padding: 1rem;
  }
  
  .sub-step-indicator {
    margin-bottom: 2rem;
  }
  
  .sub-step-title {
    font-size: 0.75rem;
  }
  
  .account-book-item {
    flex-direction: column;
    text-align: center;
  }
  
  .book-stats {
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 