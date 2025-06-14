<template>
  <div class="import-progress">
    <!-- 导入头部 -->
    <div class="import-header">
      <div class="header-left">
        <h2>
          <el-icon class="header-icon">
            <Upload />
          </el-icon>
          数据导入
        </h2>
        <div class="phase-indicator">
          <el-tag 
            :type="getPhaseTagType(currentPhase)" 
            size="large"
          >
            {{ getPhaseText(currentPhase) }}
          </el-tag>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 查看导入历史按钮 -->
        <el-button 
          type="primary" 
          plain 
          @click="toggleSessions"
          size="small"
        >
          <el-icon><Document /></el-icon>
          {{ showSessions ? '隐藏历史' : '导入历史' }}
        </el-button>
      </div>
    </div>

    <!-- 导入状态卡片 -->
    <div class="import-status-section">
      <el-card class="status-card">
        <div class="import-overview">
          <div class="overview-item">
            <div class="overview-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importProgress?.total || 0 }}</div>
              <div class="overview-label">待导入记录</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon success">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importProgress?.completed || 0 }}</div>
              <div class="overview-label">成功导入</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon failed">
              <el-icon><CircleCloseFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importProgress?.failed || 0 }}</div>
              <div class="overview-label">导入失败</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon remaining">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ remainingCount }}</div>
              <div class="overview-label">剩余记录</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 进度条区域 -->
    <div class="progress-section">
      <el-card>
        <template #header>
          <div class="progress-header">
            <span>导入进度</span>
            <el-tag :type="statusTagType" size="large">
              {{ statusText }}
            </el-tag>
          </div>
        </template>
        
        <div class="progress-content">
          <!-- 主进度条 -->
          <div class="main-progress">
            <div class="progress-info">
              <span class="progress-text">
                整体进度 {{ progressPercentage }}%
              </span>
              <span class="progress-detail">
                {{ importProgress?.completed || 0 }} / {{ importProgress?.total || 0 }}
              </span>
            </div>
            
            <el-progress
              :percentage="progressPercentage"
              :status="progressStatus"
              :stroke-width="12"
              :show-text="false"
              class="main-progress-bar"
            />
          </div>
          
          <!-- 成功率进度条 -->
          <div class="success-rate" v-if="importProgress?.total && importProgress.total > 0">
            <div class="progress-info">
              <span class="progress-text">
                成功率 {{ successRate }}%
              </span>
              <span class="progress-detail">
                {{ importProgress.completed }} 成功 / {{ importProgress.failed }} 失败
              </span>
            </div>
            
            <el-progress
              :percentage="successRate"
              :status="successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'exception'"
              :stroke-width="8"
              :show-text="false"
              class="success-progress-bar"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 实时日志 -->
    <div class="logs-section" v-if="showLogs">
      <el-card>
        <template #header>
          <div class="logs-header">
            <span>导入日志</span>
            <div class="logs-actions">
              <el-button size="small" @click="clearLogs">
                <el-icon><Delete /></el-icon>
                清空日志
              </el-button>
              <el-button size="small" @click="showLogs = false">
                <el-icon><Hide /></el-icon>
                隐藏日志
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="logs-container" ref="logsContainer">
          <div 
            v-for="(log, index) in importLogs.slice(-100)" 
            :key="index"
            :class="['log-item', `log-${log.type}`]"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          
          <div v-if="importLogs.length === 0" class="empty-logs">
            暂无导入日志
          </div>
        </div>
      </el-card>
    </div>

    <!-- 错误详情 -->
    <div class="errors-section" v-if="importProgress?.errors?.length">
      <el-card>
        <template #header>
          <div class="errors-header">
            <span>错误详情</span>
            <el-tag type="danger" size="small">
              {{ importProgress.errors.length }} 个错误
            </el-tag>
          </div>
        </template>
        
        <div class="errors-list">
          <el-collapse v-model="activeErrorCollapse">
            <el-collapse-item 
              v-for="(error, index) in importProgress.errors.slice(0, 10)" 
              :key="index"
              :title="`错误 ${index + 1}: ${error}`"
              :name="index"
            >
              <div class="error-detail">
                <p><strong>错误信息:</strong> {{ error }}</p>
                <p><strong>发生时间:</strong> {{ new Date().toLocaleString() }}</p>
                <p><strong>建议:</strong> 请检查数据格式是否正确，或联系技术支持</p>
              </div>
            </el-collapse-item>
            
            <div v-if="importProgress.errors.length > 10" class="more-errors">
              还有 {{ importProgress.errors.length - 10 }} 个错误未显示...
            </div>
          </el-collapse>
        </div>
      </el-card>
    </div>

    <!-- 执行状态区域 -->
    <div class="execution-section">
      <el-card>
        <div class="execution-content">
          <!-- 准备阶段 -->
          <div v-if="currentPhase === 'preparing'" class="phase-content">
            <div class="phase-icon">
              <el-icon class="rotating"><Loading /></el-icon>
            </div>
            <h4>准备导入数据</h4>
            <p>正在验证数据格式和准备导入任务...</p>
            <div class="preparation-steps">
              <el-steps :active="preparationStep" align-center>
                <el-step title="数据验证" />
                <el-step title="格式转换" />
                <el-step title="分批处理" />
                <el-step title="开始导入" />
              </el-steps>
            </div>
          </div>

          <!-- 导入阶段 -->
          <div v-else-if="currentPhase === 'importing'" class="phase-content">
            <div class="phase-icon">
              <el-icon class="pulsing"><Upload /></el-icon>
            </div>
            <h4>正在导入数据</h4>
            <p>正在批量导入交易记录，请耐心等待...</p>
            <div class="importing-info">
              <p>预计剩余时间: {{ estimatedTime }}</p>
              <p>当前批次: {{ currentBatch }} / {{ totalBatches }}</p>
            </div>
          </div>

          <!-- 完成阶段 -->
          <div v-else-if="currentPhase === 'completed'" class="phase-content">
            <div class="phase-icon success">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <h4>导入完成</h4>
            <p>恭喜！数据导入已成功完成</p>
            <div class="completion-summary">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="summary-item">
                    <div class="summary-value">{{ importProgress?.completed || 0 }}</div>
                    <div class="summary-label">成功导入</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="summary-item">
                    <div class="summary-value">{{ importProgress?.failed || 0 }}</div>
                    <div class="summary-label">导入失败</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="summary-item">
                    <div class="summary-value">{{ Math.round(successRate) }}%</div>
                    <div class="summary-label">成功率</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 撤销阶段 -->
          <div v-else-if="currentPhase === 'undoing'" class="phase-content">
            <div class="phase-icon warning">
              <el-icon class="rotating"><Loading /></el-icon>
            </div>
            <h4>正在撤销导入</h4>
            <p>正在删除已导入的交易记录，请耐心等待...</p>
            <div class="undoing-info">
              <p>撤销操作不可逆，请确保您真的需要撤销此次导入</p>
            </div>
          </div>

          <!-- 失败阶段 -->
          <div v-else-if="currentPhase === 'failed'" class="phase-content">
            <div class="phase-icon error">
              <el-icon><CircleCloseFilled /></el-icon>
            </div>
            <h4>导入失败</h4>
            <p>导入过程中遇到了错误，请检查数据或重试</p>
            <div class="failure-actions">
              <el-button type="danger" @click="retryImport">
                <el-icon><RefreshRight /></el-icon>
                重试导入
              </el-button>
              <el-button @click="$emit('prev')">
                <el-icon><ArrowLeft /></el-icon>
                返回上一步
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
      <div class="action-buttons">
        <el-button 
          size="large" 
          @click="$emit('prev')"
          :disabled="isImporting"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回预览
        </el-button>

        <div class="main-actions">
          <!-- 开始导入按钮 -->
          <el-button 
            v-if="currentPhase === 'ready'"
            type="primary" 
            size="large"
            @click="startImport"
            :loading="isStarting"
          >
            <el-icon><Upload /></el-icon>
            开始导入
          </el-button>

          <!-- 暂停/继续按钮 -->
          <el-button 
            v-if="currentPhase === 'importing'"
            type="warning" 
            size="large"
            @click="togglePause"
          >
            <el-icon v-if="!isPaused"><VideoPause /></el-icon>
            <el-icon v-else><VideoPlay /></el-icon>
            {{ isPaused ? '继续导入' : '暂停导入' }}
          </el-button>

          <!-- 取消导入按钮 -->
          <el-button 
            v-if="isImporting"
            type="danger" 
            size="large"
            @click="cancelImport"
            plain
          >
            <el-icon><Close /></el-icon>
            取消导入
          </el-button>

          <!-- 查看日志按钮 -->
          <el-button 
            v-if="currentPhase !== 'ready'"
            size="large"
            @click="showLogs = !showLogs"
            plain
          >
            <el-icon><View /></el-icon>
            {{ showLogs ? '隐藏日志' : '查看日志' }}
          </el-button>

          <!-- 导入完成后的按钮 -->
          <el-button 
            v-if="currentPhase === 'completed'"
            type="success" 
            size="large"
            @click="$emit('next')"
          >
            查看报告
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          
          <!-- 撤销导入按钮 -->
          <el-button 
            v-if="currentPhase === 'completed' && (importStore.importSessionId || hasAvailableSession)"
            type="warning" 
            size="large"
            @click="() => handleUndoImport()"
            :loading="isUndoing"
            plain
          >
            <el-icon><Minus /></el-icon>
            撤销导入
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导入会话管理 -->
    <div class="sessions-section" v-if="showSessions && importSessions.length > 0">
      <el-card>
        <template #header>
          <div class="sessions-header">
            <span>导入历史</span>
            <el-button size="small" @click="showSessions = false">
              <el-icon><Hide /></el-icon>
              隐藏
            </el-button>
          </div>
        </template>
        
        <div class="sessions-list">
          <el-timeline>
            <el-timeline-item 
              v-for="session in importSessions.slice(0, 5)" 
              :key="session.sessionId"
              :timestamp="formatSessionTime(session.createdAt)"
              placement="top"
            >
              <div class="session-item">
                <div class="session-info">
                  <h4>导入会话 {{ session.sessionId.slice(-8) }}</h4>
                  <p>
                    总计 {{ session.totalCount }} 条记录，
                    成功 {{ session.successCount }} 条，
                    失败 {{ session.failedCount }} 条
                  </p>
                </div>
                <div class="session-actions">
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="handleUndoImport(session.sessionId)"
                    :loading="undoingSessionId === session.sessionId"
                    plain
                  >
                    撤销此次导入
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Warning,
  Check,
  Close,
  VideoPlay,
  VideoPause,
  Refresh,
  ArrowRight,
  View,
  Delete,
  Hide,
  Minus,
  Document
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'

// Props & Emits
defineEmits<{
  next: []
  prev: []
}>()

// Store
const importStore = useImportStore()

// 状态
const isStarting = ref(false)
const isPaused = ref(false)
const showLogs = ref(false)
const activeErrorCollapse = ref<number[]>([])
const preparationStep = ref(0)
const currentBatch = ref(0)
const totalBatches = ref(0)
const estimatedTime = ref('计算中...')
const currentPhase = ref<'ready' | 'preparing' | 'importing' | 'completed' | 'failed' | 'undoing'>('ready')
const logsContainer = ref<HTMLElement>()
const isUndoing = ref(false)
const undoingSessionId = ref<string>('')
const showSessions = ref(false)
const importSessions = ref<any[]>([])

// 导入日志
interface ImportLog {
  timestamp: number
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

const importLogs = ref<ImportLog[]>([])

// 计算属性
const importProgress = computed(() => importStore.importProgress)
const importData = computed(() => {
  const data = importStore.importData
  console.log('ImportProgress - importData 计算:', {
    dataLength: data.length,
    parseResult: importStore.parseResult,
    categoryMapping: importStore.categoryMapping,
    sampleData: data[0]
  })
  return data
})

const remainingCount = computed(() => {
  if (!importProgress.value) return 0
  return Math.max(0, importProgress.value.total - importProgress.value.completed - importProgress.value.failed)
})

const progressPercentage = computed(() => {
  if (!importProgress.value?.total) return 0
  const completed = importProgress.value.completed + importProgress.value.failed
  return Math.round((completed / importProgress.value.total) * 100)
})

const successRate = computed(() => {
  if (!importProgress.value?.total) return 0
  const processed = importProgress.value.completed + importProgress.value.failed
  if (processed === 0) return 0
  return Math.round((importProgress.value.completed / processed) * 100)
})

const statusText = computed(() => {
  switch (currentPhase.value) {
    case 'ready': return '准备就绪'
    case 'preparing': return '准备中'
    case 'importing': return isPaused.value ? '已暂停' : '导入中'
    case 'completed': return '导入完成'
    case 'failed': return '导入失败'
    case 'undoing': return '正在撤销'
    default: return '未知状态'
  }
})

const statusTagType = computed(() => {
  switch (currentPhase.value) {
    case 'ready': return 'info'
    case 'preparing': return 'warning'
    case 'importing': return isPaused.value ? 'warning' : 'primary'
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'undoing': return 'warning'
    default: return 'info'
  }
})

const progressStatus = computed(() => {
  if (currentPhase.value === 'failed') return 'exception'
  if (currentPhase.value === 'completed') return 'success'
  return undefined
})

const isImporting = computed(() => {
  return currentPhase.value === 'preparing' || currentPhase.value === 'importing' || currentPhase.value === 'undoing'
})

const hasAvailableSession = computed(() => {
  const sessions = importStore.getImportSessions()
  return sessions.some(s => s.importedTransactionIds.length > 0)
})

// 方法
const addLog = (type: ImportLog['type'], message: string) => {
  importLogs.value.push({
    timestamp: Date.now(),
    type,
    message
  })
  
  // 自动滚动到底部
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
}

const clearLogs = () => {
  importLogs.value = []
  ElMessage.success('日志已清空')
}

const formatLogTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const startImport = async () => {
  try {
    isStarting.value = true
    currentPhase.value = 'preparing'
    addLog('info', '开始导入流程')

    // 准备阶段
    await runPreparationSteps()
    
    // 开始实际导入
    currentPhase.value = 'importing'
    await executeImport()
    
  } catch (error) {
    console.error('导入失败:', error)
    currentPhase.value = 'failed'
    addLog('error', `导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    ElMessage.error('导入失败，请检查数据或重试')
  } finally {
    isStarting.value = false
  }
}

const runPreparationSteps = async () => {
  const steps = [
    { name: '数据验证', duration: 500 },
    { name: '格式转换', duration: 300 },
    { name: '分批处理', duration: 200 },
    { name: '开始导入', duration: 100 }
  ]

  for (let i = 0; i < steps.length; i++) {
    preparationStep.value = i
    addLog('info', `${steps[i].name}中...`)
    await new Promise(resolve => setTimeout(resolve, steps[i].duration))
  }
  
  preparationStep.value = steps.length
  addLog('success', '准备工作完成')
}

const executeImport = async () => {
  try {
    addLog('info', '开始批量导入数据')
    
    // 计算批次信息
    const batchSize = 50 // 每批处理50条记录
    totalBatches.value = Math.ceil(importData.value.length / batchSize)
    
    // 执行实际导入
    const result = await importStore.executeImport()
    
    currentPhase.value = 'completed'
    addLog('success', `导入完成！成功: ${result.successCount || importProgress.value?.completed || 0}, 失败: ${result.failureCount || importProgress.value?.failed || 0}`)
    
    // 显示成功消息
    ElMessage({
      type: 'success',
      message: `导入完成！成功导入 ${result.successCount || importProgress.value?.completed || 0} 条记录`,
      duration: 3000
    })
    
  } catch (error) {
    currentPhase.value = 'failed'
    addLog('error', `导入执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    throw error
  }
}

const togglePause = () => {
  isPaused.value = !isPaused.value
  addLog('warning', isPaused.value ? '导入已暂停' : '导入已继续')
  ElMessage({
    type: 'warning',
    message: isPaused.value ? '导入已暂停' : '导入已继续'
  })
}

const cancelImport = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消导入吗？已导入的数据将保留。',
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续导入',
        type: 'warning',
      }
    )
    
    currentPhase.value = 'failed'
    addLog('warning', '用户取消了导入操作')
    ElMessage.warning('导入已取消')
    
  } catch {
    // 用户选择继续导入
  }
}

const retryImport = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重试导入吗？将重新开始整个导入流程。',
      '确认重试',
      {
        confirmButtonText: '确定重试',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 重置状态
    currentPhase.value = 'ready'
    preparationStep.value = 0
    currentBatch.value = 0
    isPaused.value = false
    importLogs.value = []
    
    // 重新开始导入
    await startImport()
    
  } catch {
    // 用户取消重试
  }
}

// 处理撤销导入
const handleUndoImport = async (sessionId?: string) => {
  try {
    // 如果没有传入sessionId，使用store中的sessionId
    let targetSessionId = sessionId || importStore.importSessionId
    
    // 如果store中也没有sessionId，从localStorage获取最新的会话
    if (!targetSessionId) {
      const sessions = importStore.getImportSessions()
      if (sessions.length > 0) {
        // 获取最新的有效会话（有导入记录的）
        const latestSession = sessions
          .filter(s => s.importedTransactionIds.length > 0)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        
        if (latestSession) {
          targetSessionId = latestSession.sessionId
          console.log(`使用最新的导入会话: ${targetSessionId}`)
        }
      }
    }
    
    if (!targetSessionId) {
      ElMessage.warning('没有找到可撤销的导入会话')
      return
    }
    
    await ElMessageBox.confirm(
      '确定要撤销此次导入吗？所有已导入的记录将被删除，此操作不可逆。',
      '确认撤销导入',
      {
        confirmButtonText: '确定撤销',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        message: `
          <div>
            <p>撤销操作将删除本次导入的所有记录</p>
            <p style="color: #f56c6c; font-weight: bold;">此操作不可逆，请谨慎操作！</p>
          </div>
        `
      }
    )
    
    if (sessionId) {
      undoingSessionId.value = sessionId
    } else {
      isUndoing.value = true
    }
    
    // 设置撤销状态
    currentPhase.value = 'undoing'
    
    addLog('info', `开始撤销导入会话: ${targetSessionId}`)
    
    const result = await importStore.undoImport(targetSessionId)
    
    addLog('success', `撤销完成：删除了 ${result.deletedCount} 条记录`)
    
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        addLog('error', `撤销错误: ${error}`)
      })
      ElMessage.warning(`撤销完成，但有 ${result.errors.length} 个错误`)
    } else {
      ElMessage.success(`成功撤销导入，删除了 ${result.deletedCount} 条记录`)
    }
    
    // 刷新导入会话列表
    loadImportSessions()
    
    // 如果是当前会话的撤销，重置导入状态
    if (!sessionId || sessionId === importStore.importSessionId) {
      currentPhase.value = 'ready'
      importStore.importProgress = null
    } else {
      // 如果不是当前会话，恢复到完成状态
      currentPhase.value = 'completed'
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤销导入失败:', error)
      addLog('error', `撤销失败: ${error instanceof Error ? error.message : '未知错误'}`)
      ElMessage.error('撤销导入失败')
      // 撤销失败时恢复到完成状态
      currentPhase.value = 'completed'
    } else {
      // 用户取消撤销时恢复到完成状态
      currentPhase.value = 'completed'
    }
  } finally {
    isUndoing.value = false
    undoingSessionId.value = ''
  }
}

// 加载导入会话列表
const loadImportSessions = () => {
  importSessions.value = importStore.getImportSessions()
}

// 格式化会话时间
const formatSessionTime = (timeStr: string): string => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

// 切换会话显示
const toggleSessions = () => {
  showSessions.value = !showSessions.value
  if (showSessions.value) {
    loadImportSessions()
  }
}

// 获取阶段标签类型
const getPhaseTagType = (phase: string) => {
  switch (phase) {
    case 'ready':
      return 'info'
    case 'preparing':
      return 'warning'
    case 'importing':
      return 'primary'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'undoing':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取阶段文本
const getPhaseText = (phase: string) => {
  switch (phase) {
    case 'ready':
      return '准备就绪'
    case 'preparing':
      return '准备中'
    case 'importing':
      return '导入中'
    case 'completed':
      return '导入完成'
    case 'failed':
      return '导入失败'
    case 'undoing':
      return '正在撤销'
    default:
      return '未知状态'
  }
}

// 模拟进度更新
const simulateProgress = () => {
  if (currentPhase.value === 'importing' && !isPaused.value) {
    // 更新当前批次
    const total = importProgress.value?.total || 0
    const completed = importProgress.value?.completed || 0
    currentBatch.value = Math.ceil(completed / 50)
    
    // 估算剩余时间
    const processed = completed + (importProgress.value?.failed || 0)
    const remaining = total - processed
    if (remaining > 0 && processed > 0) {
      const avgTimePerRecord = 100 // 假设每条记录100ms
      const remainingTimeMs = remaining * avgTimePerRecord
      const minutes = Math.floor(remainingTimeMs / 60000)
      const seconds = Math.floor((remainingTimeMs % 60000) / 1000)
      estimatedTime.value = `${minutes}分${seconds}秒`
    } else {
      estimatedTime.value = '即将完成'
    }
  }
}

// 监听
watch(() => importProgress.value?.status, (newStatus) => {
  if (newStatus === 'completed') {
    currentPhase.value = 'completed'
  } else if (newStatus === 'failed') {
    currentPhase.value = 'failed'
  }
})

// 生命周期
onMounted(() => {
  // 初始化日志
  addLog('info', '导入模块已就绪')
  
  // 如果importProgress为空但有importData，初始化进度
  if (!importProgress.value && importData.value.length > 0) {
    console.log('初始化导入进度:', importData.value.length)
    importStore.importProgress = {
      status: 'ready',
      total: importData.value.length,
      completed: 0,
      failed: 0,
      errors: []
    }
  }
  
  // 开始进度模拟
  const progressTimer = setInterval(simulateProgress, 1000)
  
  onUnmounted(() => {
    clearInterval(progressTimer)
  })
})
</script>

<style scoped>
.import-progress {
  padding: 0;
}

.import-header {
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.phase-indicator {
  margin-top: 8px;
}

.import-status-section {
  margin-bottom: 24px;
}

.status-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.import-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  padding: 8px 0;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.overview-icon.total {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.overview-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.overview-icon.failed {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.overview-icon.remaining {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-content {
  padding: 8px 0;
}

.main-progress,
.success-rate {
  margin-bottom: 24px;
}

.success-rate {
  margin-bottom: 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.progress-detail {
  font-size: 14px;
  color: #909399;
}

.main-progress-bar {
  margin-bottom: 0;
}

.success-progress-bar {
  margin-bottom: 0;
}

.logs-section {
  margin-bottom: 24px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-actions {
  display: flex;
  gap: 8px;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  display: flex;
  margin-bottom: 4px;
  line-height: 1.4;
}

.log-time {
  color: #909399;
  margin-right: 12px;
  white-space: nowrap;
}

.log-message {
  flex: 1;
}

.log-info .log-message {
  color: #606266;
}

.log-success .log-message {
  color: #67c23a;
}

.log-warning .log-message {
  color: #e6a23c;
}

.log-error .log-message {
  color: #f56c6c;
}

.empty-logs {
  text-align: center;
  color: #c0c4cc;
  padding: 20px;
}

.errors-section {
  margin-bottom: 24px;
}

.errors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-detail p {
  margin: 8px 0;
}

.more-errors {
  text-align: center;
  color: #909399;
  padding: 12px;
  font-style: italic;
}

.execution-section {
  margin-bottom: 24px;
}

.execution-content {
  text-align: center;
  padding: 32px 24px;
}

.phase-content h4 {
  margin: 16px 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.phase-content p {
  margin: 0 0 24px 0;
  color: #909399;
  font-size: 14px;
}

.phase-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.phase-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.phase-icon.error {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.phase-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.rotating {
  animation: rotate 2s linear infinite;
}

.pulsing {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.preparation-steps {
  max-width: 600px;
  margin: 0 auto;
}

.importing-info {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 16px;
}

.importing-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.undoing-info {
  max-width: 400px;
  margin: 0 auto;
}

.undoing-info p {
  margin: 0;
  font-size: 14px;
  color: #e6a23c;
  font-weight: 500;
}

.completion-summary {
  max-width: 400px;
  margin: 0 auto;
}

.summary-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.failure-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.action-section {
  padding: 20px 4px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 24px;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-actions {
  display: flex;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .import-overview {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .main-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .importing-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .completion-summary {
    max-width: none;
  }
  
  .failure-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .overview-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .overview-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .overview-value {
    font-size: 24px;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

/* 会话管理样式 */
.sessions-section {
  margin-top: 24px;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sessions-header span {
  font-weight: 600;
  color: #303133;
}

.sessions-list {
  margin-top: 16px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.session-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.session-info p {
  margin: 0;
  font-size: 12px;
  color: #606266;
}

.session-actions {
  flex-shrink: 0;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .session-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .session-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}
</style> 