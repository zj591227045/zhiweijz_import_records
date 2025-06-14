<template>
  <div class="import-report">
    <!-- 报告头部 -->
    <div class="report-header">
      <div class="header-info">
        <h3>
          <el-icon><DocumentChecked /></el-icon>
          导入报告
        </h3>
        <p>数据导入已完成，以下是详细的导入结果分析</p>
      </div>
      
      <!-- 状态标志 -->
      <div class="status-indicator">
        <el-tag 
          :type="overallStatus.type" 
          size="large"
          :effect="overallStatus.effect"
        >
          <el-icon><component :is="overallStatus.icon" /></el-icon>
          {{ overallStatus.text }}
        </el-tag>
      </div>
    </div>

    <!-- 导入概览统计 -->
    <div class="overview-section">
      <el-card class="overview-card">
        <template #header>
          <div class="card-header">
            <span>导入概览</span>
            <el-button 
              size="small" 
              type="primary" 
              text
              @click="downloadReport"
              :loading="isDownloading"
            >
              <el-icon><Download /></el-icon>
              下载报告
            </el-button>
          </div>
        </template>
        
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-icon total">
              <el-icon><DataBoard /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importProgress?.total || 0 }}</div>
              <div class="overview-label">总计记录</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon success">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importProgress?.completed || 0 }}</div>
              <div class="overview-label">成功导入</div>
              <div class="overview-percent">{{ successRate }}%</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon failed">
              <el-icon><CircleCloseFilled /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importProgress?.failed || 0 }}</div>
              <div class="overview-label">导入失败</div>
              <div class="overview-percent">{{ failureRate }}%</div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="overview-icon time">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ importDuration }}</div>
              <div class="overview-label">导入耗时</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分类统计 -->
    <div class="category-section" v-if="categoryBreakdown.length > 0">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>分类统计</span>
            <el-radio-group v-model="categoryViewMode" size="small">
              <el-radio-button label="chart">图表视图</el-radio-button>
              <el-radio-button label="list">列表视图</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        
        <!-- 饼图视图 -->
        <div v-if="categoryViewMode === 'chart'" class="category-chart">
          <div class="chart-container">
            <!-- 这里可以集成图表库，现在用简单的进度条代替 -->
            <div class="category-progress-list">
              <div 
                v-for="(category, index) in categoryBreakdown.slice(0, 6)" 
                :key="category.name"
                class="category-progress-item"
              >
                <div class="category-info">
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-stats">{{ category.count }} 条 ({{ category.percentage }}%)</span>
                </div>
                <el-progress
                  :percentage="category.percentage"
                  :color="getCategoryColor(index)"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
          
          <!-- 图例 -->
          <div class="chart-legend">
            <div 
              v-for="(category, index) in categoryBreakdown.slice(0, 6)" 
              :key="category.name"
              class="legend-item"
            >
              <div 
                class="legend-color" 
                :style="{ backgroundColor: getCategoryColor(index) }"
              ></div>
              <span class="legend-text">{{ category.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 列表视图 -->
        <div v-else class="category-list">
          <el-table :data="categoryBreakdown" style="width: 100%">
            <el-table-column prop="name" label="分类名称" min-width="120">
              <template #default="{ row }">
                <div class="category-cell">
                  <el-tag :type="row.type === 'income' ? 'success' : 'info'" size="small">
                    {{ row.type === 'income' ? '收入' : '支出' }}
                  </el-tag>
                  <span class="category-name">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="记录数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="primary" plain>{{ row.count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="总金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="{ 'amount-income': row.type === 'income', 'amount-expense': row.type === 'expense' }">
                  {{ row.type === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="占比" width="80" align="center">
              <template #default="{ row }">
                {{ row.percentage }}%
              </template>
            </el-table-column>
            <el-table-column label="占比图示" width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.percentage"
                  :color="row.type === 'income' ? '#67c23a' : '#409eff'"
                  :stroke-width="6"
                  :show-text="false"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 错误详情 -->
    <div class="errors-section" v-if="importProgress?.errors?.length">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>错误详情</span>
            <el-tag type="danger" size="small">
              {{ importProgress.errors.length }} 个错误
            </el-tag>
          </div>
        </template>
        
        <div class="errors-content">
          <el-alert
            title="导入错误分析"
            type="warning"
            :closable="false"
            class="error-analysis"
          >
            <template #default>
              <p>检测到以下导入错误，建议您：</p>
              <ul>
                <li>检查源数据格式是否正确</li>
                <li>确认分类映射是否准确</li>
                <li>验证日期和金额格式</li>
                <li>重新尝试导入失败的记录</li>
              </ul>
            </template>
          </el-alert>
          
          <div class="error-list">
            <el-collapse v-model="activeErrorPanel">
              <el-collapse-item 
                v-for="(error, index) in importProgress.errors.slice(0, 20)" 
                :key="index"
                :title="`错误 ${index + 1}: ${error}`"
                :name="index"
              >
                <div class="error-detail">
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="错误类型">
                      <el-tag type="danger" size="small">导入失败</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="错误信息">
                      {{ error }}
                    </el-descriptions-item>
                    <el-descriptions-item label="发生时间">
                      {{ new Date().toLocaleString() }}
                    </el-descriptions-item>
                    <el-descriptions-item label="建议解决方案">
                      请检查数据格式，确保所有必填字段都已正确填写
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-collapse-item>
              
              <div v-if="importProgress.errors.length > 20" class="more-errors">
                <el-alert
                  :title="`还有 ${importProgress.errors.length - 20} 个错误未显示`"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <p>如需查看所有错误详情，请下载完整报告</p>
                  </template>
                </el-alert>
              </div>
            </el-collapse>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 成功记录预览 -->
    <div class="success-section" v-if="importProgress?.completed && importProgress.completed > 0">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>成功导入记录预览</span>
            <el-tag type="success" size="small">
              前 {{ Math.min(5, importProgress.completed) }} 条记录
            </el-tag>
          </div>
        </template>
        
        <div class="success-records">
          <el-table :data="previewData" style="width: 100%">
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="150" />
            <el-table-column prop="mappedCategory" label="分类" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.direction === 'income' ? 'success' : 'info'">
                  {{ getCategoryName(row.mappedCategory) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="{ 'amount-income': row.direction === 'income', 'amount-expense': row.direction === 'expense' }">
                  {{ row.direction === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="importProgress.completed > 5" class="more-records">
            <el-text type="info">
              还有 {{ importProgress.completed - 5 }} 条记录已成功导入，请在账本中查看完整数据
            </el-text>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 后续操作建议 -->
    <div class="suggestions-section">
      <el-card>
        <template #header>
          <span>后续操作建议</span>
        </template>
        
        <div class="suggestions-grid">
          <div class="suggestion-item">
            <div class="suggestion-icon">
              <el-icon><View /></el-icon>
            </div>
            <div class="suggestion-content">
              <h4>查看导入数据</h4>
              <p>前往账本查看已导入的交易记录，验证数据准确性</p>
              <el-button size="small" type="primary" @click="goToAccountBook">
                查看账本
              </el-button>
            </div>
          </div>
          
          <div class="suggestion-item" v-if="importProgress?.failed && importProgress.failed > 0">
            <div class="suggestion-icon">
              <el-icon><RefreshRight /></el-icon>
            </div>
            <div class="suggestion-content">
              <h4>重新导入失败记录</h4>
              <p>修正错误数据后，可以重新尝试导入失败的记录</p>
              <el-button size="small" type="warning" @click="retryFailedImport">
                重新导入
              </el-button>
            </div>
          </div>
          
          <div class="suggestion-item">
            <div class="suggestion-icon">
              <el-icon><Download /></el-icon>
            </div>
            <div class="suggestion-content">
              <h4>下载详细报告</h4>
              <p>下载包含所有详细信息的完整导入报告</p>
              <el-button size="small" @click="downloadDetailedReport" :loading="isDownloadingDetailed">
                下载报告
              </el-button>
            </div>
          </div>
          
          <div class="suggestion-item">
            <div class="suggestion-icon">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="suggestion-content">
              <h4>继续导入数据</h4>
              <p>导入更多交易记录或其他类型的财务数据</p>
              <el-button size="small" @click="$emit('restart')">
                新建导入
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
          type="primary" 
          size="large"
          @click="$emit('go-home')"
        >
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        
        <el-button 
          size="large"
          @click="$emit('restart')"
          plain
        >
          <el-icon><Refresh /></el-icon>
          重新导入
        </el-button>
        
        <!-- 撤销导入按钮 -->
        <el-button 
          v-if="importStore.importSessionId || hasAvailableSession"
          type="warning" 
          size="large"
          @click="() => handleUndoImport()"
          :loading="isUndoing"
          plain
        >
          <el-icon><Delete /></el-icon>
          撤销导入
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentChecked,
  CircleCheckFilled,
  CircleCloseFilled,
  SuccessFilled,
  WarningFilled,
  DataBoard,
  Clock,
  Download,
  View,
  RefreshRight,
  Plus,
  House,
  HomeFilled,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'

// Props & Emits
const emit = defineEmits<{
  restart: []
  'go-home': []
}>()

// Store
const importStore = useImportStore()

// 状态
const isDownloading = ref(false)
const isDownloadingDetailed = ref(false)
const isUndoing = ref(false)
const categoryViewMode = ref<'chart' | 'list'>('chart')
const activeErrorPanel = ref<number[]>([])
const importStartTime = ref<number>(Date.now() - 30000) // 模拟30秒前开始

// 计算属性
const importProgress = computed(() => importStore.importProgress)
const importData = computed(() => importStore.importData)
const availableCategories = computed(() => importStore.availableCategories)

const successRate = computed(() => {
  if (!importProgress.value?.total) return 0
  return Math.round((importProgress.value.completed / importProgress.value.total) * 100)
})

const failureRate = computed(() => {
  if (!importProgress.value?.total) return 0
  return Math.round((importProgress.value.failed / importProgress.value.total) * 100)
})

const importDuration = computed(() => {
  const duration = Math.round((Date.now() - importStartTime.value) / 1000)
  if (duration < 60) return `${duration}秒`
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}分${seconds}秒`
})

const overallStatus = computed(() => {
  if (!importProgress.value) {
    return { type: 'info', effect: 'light', icon: 'InfoFilled', text: '无数据' }
  }
  
  const { completed, failed, total } = importProgress.value
  const successRate = total > 0 ? (completed / total) * 100 : 0
  
  if (successRate === 100) {
    return { type: 'success', effect: 'dark', icon: 'SuccessFilled', text: '导入成功' }
  } else if (successRate >= 80) {
    return { type: 'success', effect: 'light', icon: 'SuccessFilled', text: '基本成功' }
  } else if (successRate >= 50) {
    return { type: 'warning', effect: 'light', icon: 'WarningFilled', text: '部分成功' }
  } else if (completed > 0) {
    return { type: 'danger', effect: 'light', icon: 'WarningFilled', text: '大部分失败' }
  } else {
    return { type: 'danger', effect: 'dark', icon: 'CircleCloseFilled', text: '导入失败' }
  }
})

const categoryBreakdown = computed(() => {
  if (!importData.value.length) return []
  
  const categoryStats: Record<string, { count: number; amount: number; type: string }> = {}
  
  importData.value.forEach(record => {
    const categoryId = record.mappedCategory
    const categoryName = getCategoryName(categoryId)
    const category = availableCategories.value.find(c => c.id === categoryId)
    const type = category?.type === 'INCOME' ? 'income' : 'expense'
    
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = { count: 0, amount: 0, type }
    }
    
    categoryStats[categoryName].count++
    categoryStats[categoryName].amount += Math.abs(record.amount)
  })
  
  return Object.entries(categoryStats)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      amount: stats.amount,
      type: stats.type,
      percentage: Math.round((stats.count / importData.value.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
})

const previewData = computed(() => {
  return importData.value.slice(0, 5)
})

const hasAvailableSession = computed(() => {
  const sessions = importStore.getImportSessions()
  return sessions.some(s => s.importedTransactionIds.length > 0)
})

// 方法
const getCategoryName = (categoryId: string): string => {
  const category = availableCategories.value.find(c => c.id === categoryId)
  return category?.name || categoryId
}

const getCategoryColor = (index: number): string => {
  const colors = [
    '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#b88ce8'
  ]
  return colors[index % colors.length]
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(Math.abs(amount))
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const downloadReport = async () => {
  try {
    isDownloading.value = true
    
    // 生成报告内容
    const reportContent = generateReportContent()
    
    // 创建并下载文件
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `导入报告_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('报告下载完成')
  } catch (error) {
    ElMessage.error('报告下载失败')
  } finally {
    isDownloading.value = false
  }
}

const downloadDetailedReport = async () => {
  try {
    isDownloadingDetailed.value = true
    
    // 生成详细报告（CSV格式）
    const csvContent = generateDetailedCSV()
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `详细导入报告_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('详细报告下载完成')
  } catch (error) {
    ElMessage.error('详细报告下载失败')
  } finally {
    isDownloadingDetailed.value = false
  }
}

const generateReportContent = (): string => {
  const lines = [
    '=== 交易数据导入报告 ===',
    `生成时间: ${new Date().toLocaleString()}`,
    `导入耗时: ${importDuration.value}`,
    '',
    '=== 导入概览 ===',
    `总计记录: ${importProgress.value?.total || 0}`,
    `成功导入: ${importProgress.value?.completed || 0} (${successRate.value}%)`,
    `导入失败: ${importProgress.value?.failed || 0} (${failureRate.value}%)`,
    '',
    '=== 分类统计 ===',
    ...categoryBreakdown.value.map(cat => 
      `${cat.name}: ${cat.count}条 (${cat.percentage}%) - ${formatAmount(cat.amount)}`
    ),
    ''
  ]
  
  if (importProgress.value?.errors?.length) {
    lines.push('=== 错误详情 ===')
    importProgress.value.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error}`)
    })
  }
  
  return lines.join('\n')
}

const generateDetailedCSV = (): string => {
  const headers = ['日期', '描述', '金额', '分类', '收支方向', '状态']
  const rows = importData.value.map(record => [
    record.date,
    record.description,
    record.amount.toString(),
    getCategoryName(record.mappedCategory),
    record.direction === 'income' ? '收入' : '支出',
    '成功'
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
    
  return '\uFEFF' + csvContent // 添加BOM以支持中文
}

const goToAccountBook = () => {
  const serverURL = importStore.serverConfig?.baseURL
  if (serverURL) {
    // 跳转到服务器URL（不带/api）
    window.open(serverURL, '_blank')
    ElMessage.success('已在新窗口打开账本页面')
  } else {
    ElMessage.warning('无法获取服务器地址，请重新配置')
  }
}

const retryFailedImport = () => {
  ElMessage.info('重新导入功能开发中')
  // 这里可以实现重新导入失败记录的逻辑
}

const handleUndoImport = async () => {
  try {
    // 获取最新的会话ID
    let targetSessionId = importStore.importSessionId
    
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
    
    isUndoing.value = true
    
    const result = await importStore.undoImport(targetSessionId)
    
    if (result.errors.length > 0) {
      ElMessage.warning(`撤销完成，但有 ${result.errors.length} 个错误`)
      console.warn('撤销错误:', result.errors)
    } else {
      ElMessage.success(`成功撤销导入，删除了 ${result.deletedCount} 条记录`)
    }
    
    // 撤销成功后返回首页
    emit('go-home')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤销导入失败:', error)
      ElMessage.error('撤销导入失败')
    }
  } finally {
    isUndoing.value = false
  }
}

// 生命周期
onMounted(() => {
  // 记录实际的导入完成时间
  importStartTime.value = Date.now() - 30000 // 假设30秒前开始
})
</script>

<style scoped>
.import-report {
  padding: 0;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.status-indicator {
  flex-shrink: 0;
}

.overview-section {
  margin-bottom: 24px;
}

.overview-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  padding: 8px 0;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #fafbfc;
  border-radius: 8px;
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

.overview-icon.time {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 2px;
}

.overview-percent {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.category-section,
.errors-section,
.success-section,
.suggestions-section {
  margin-bottom: 24px;
}

.category-chart {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  align-items: center;
}

.category-progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-weight: 500;
  color: #303133;
}

.category-stats {
  font-size: 14px;
  color: #909399;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-text {
  font-size: 14px;
  color: #606266;
}

.category-list {
  max-height: 400px;
  overflow-y: auto;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-name {
  font-weight: 500;
}

.amount-income {
  color: #67c23a;
  font-weight: 500;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 500;
}

.errors-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-analysis {
  margin-bottom: 16px;
}

.error-analysis ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.error-analysis li {
  margin-bottom: 4px;
}

.error-detail {
  padding: 8px 0;
}

.more-errors {
  margin-top: 16px;
}

.success-records {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.more-records {
  text-align: center;
  padding: 16px;
  background-color: #fafbfc;
  border-radius: 6px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.suggestion-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.suggestion-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.suggestion-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
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

/* 响应式 */
@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .category-chart {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .overview-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .overview-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .suggestion-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .suggestion-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
    margin: 0 auto;
  }
}
</style> 