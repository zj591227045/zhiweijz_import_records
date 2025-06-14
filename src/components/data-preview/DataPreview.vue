<template>
  <div class="data-preview">
    <!-- 预览头部 -->
    <div class="preview-header">
      <div class="header-info">
        <h3>
          <el-icon><View /></el-icon>
          数据预览
        </h3>
        <p>检查即将导入的数据是否正确</p>
      </div>
      
      <div class="header-actions">
        <el-button @click="refreshPreview" :loading="isRefreshing">
          <el-icon><Refresh /></el-icon>
          刷新预览
        </el-button>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon income">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalRecords }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon income">
                <el-icon><ArrowUp /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.incomeRecords }}</div>
                <div class="stat-label">收入记录</div>
                <div class="stat-amount">¥{{ formatAmount(statistics.incomeAmount) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon expense">
                <el-icon><ArrowDown /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.expenseRecords }}</div>
                <div class="stat-label">支出记录</div>
                <div class="stat-amount">¥{{ formatAmount(statistics.expenseAmount) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon date">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ dateRangeText }}</div>
                <div class="stat-label">日期范围</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 验证状态 -->
    <div v-if="validation.errors.length > 0 || validation.warnings.length > 0" class="validation-section">
      <el-alert
        v-if="validation.errors.length > 0"
        title="数据验证错误"
        type="error"
        :closable="false"
        show-icon
      >
        <div class="validation-content">
          <p>发现 {{ validation.errors.length }} 个错误，需要修正后才能导入：</p>
          <ul class="error-list">
            <li v-for="error in validation.errors.slice(0, 5)" :key="error.index">
              第{{ error.index + 1 }}行 {{ error.field }}：{{ error.message }}
            </li>
            <li v-if="validation.errors.length > 5">
              还有 {{ validation.errors.length - 5 }} 个错误...
            </li>
          </ul>
        </div>
      </el-alert>
      
      <el-alert
        v-if="validation.warnings.length > 0"
        title="数据验证警告"
        type="warning"
        :closable="false"
        show-icon
        class="warning-alert"
      >
        <div class="validation-content">
          <p>发现 {{ validation.warnings.length }} 个警告，建议检查：</p>
          <ul class="warning-list">
            <li v-for="warning in validation.warnings.slice(0, 3)" :key="warning.index">
              第{{ warning.index + 1 }}行 {{ warning.field }}：{{ warning.message }}
            </li>
            <li v-if="validation.warnings.length > 3">
              还有 {{ validation.warnings.length - 3 }} 个警告...
            </li>
          </ul>
        </div>
      </el-alert>
    </div>

    <!-- 分类统计 -->
    <div class="category-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>分类统计</span>
            <el-button 
              text 
              @click="showCategoryDetail = !showCategoryDetail"
            >
              {{ showCategoryDetail ? '收起' : '展开' }}
            </el-button>
          </div>
        </template>
        
        <div class="category-summary">
          <el-tag 
            v-for="(stat, categoryId) in statistics.categories" 
            :key="categoryId"
            :type="getCategoryTagType(stat.name)"
            class="category-tag"
          >
            {{ stat.name }} ({{ stat.count }})
          </el-tag>
        </div>
        
        <el-collapse-transition>
          <div v-if="showCategoryDetail" class="category-detail">
            <el-table :data="categoryStats" size="small" style="margin-top: 16px;">
              <el-table-column prop="name" label="分类名称" min-width="120" />
              <el-table-column prop="count" label="记录数" width="80" align="center" />
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="占比" width="80" align="center">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-collapse-transition>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <div class="data-table-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>数据记录 ({{ displayData.length }} / {{ previewData.length }})</span>
            <div class="table-actions">
              <el-input
                v-model="searchText"
                placeholder="搜索记录..."
                size="small"
                style="width: 200px; margin-right: 12px;"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              
              <el-select
                v-model="filterDirection"
                placeholder="收支类型"
                size="small"
                style="width: 120px; margin-right: 12px;"
                clearable
              >
                <el-option label="全部" value="" />
                <el-option label="收入" value="income" />
                <el-option label="支出" value="expense" />
              </el-select>
              
              <el-button size="small" @click="exportPreview">
                <el-icon><Download /></el-icon>
                导出预览
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="pagedData" 
          style="width: 100%"
          :max-height="500"
          stripe
          @sort-change="handleSort"
        >
          <el-table-column type="index" label="#" width="60" />
          
          <el-table-column prop="date" label="日期" width="120" sortable="custom">
            <template #default="{ row }">
              <span :class="{ 'error-field': hasFieldError(row.index, 'date') }">
                {{ formatDate(row.date) }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="{ row }">
              <span :class="{ 'error-field': hasFieldError(row.index, 'description') }">
                {{ row.description }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="amount" label="金额" width="120" align="right" sortable="custom">
            <template #default="{ row }">
              <span 
                :class="{ 
                  'error-field': hasFieldError(row.index, 'amount'),
                  'amount-income': row.direction === 'income',
                  'amount-expense': row.direction === 'expense'
                }"
              >
                {{ row.direction === 'income' ? '+' : '-' }}¥{{ formatAmount(Math.abs(row.amount)) }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="mappedCategory" label="分类" width="150">
            <template #default="{ row }">
              <el-tag 
                :type="getCategoryTagType(row.mappedCategoryName)"
                size="small"
                :class="{ 'error-field': hasFieldError(row.index, 'category') }"
              >
                {{ row.mappedCategoryName || '未分类' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="budget" label="预算" width="120">
            <template #default="{ row }">
              <span v-if="row.budget" class="budget-info">
                {{ row.budget }}
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-icon 
                v-if="hasRowError(row.index)" 
                color="#f56c6c" 
                size="16"
                title="此行有错误"
              >
                <Warning />
              </el-icon>
              <el-icon 
                v-else-if="hasRowWarning(row.index)" 
                color="#e6a23c" 
                size="16"
                title="此行有警告"
              >
                <InfoFilled />
              </el-icon>
              <el-icon 
                v-else 
                color="#67c23a" 
                size="16"
                title="正常"
              >
                <SuccessFilled />
              </el-icon>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="displayData.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 底部操作 -->
    <div class="preview-footer">
      <div class="footer-info">
        <el-icon><InfoFilled /></el-icon>
        <span>预览数据仅用于检查，实际导入可能因服务器验证而有所不同</span>
      </div>
      
      <div class="footer-actions">
        <el-button size="large" @click="$emit('prev')">
          <el-icon><ArrowLeft /></el-icon>
          返回映射
        </el-button>
        
        <el-button 
          type="primary" 
          size="large" 
          @click="$emit('next')"
          :disabled="!canProceed"
        >
          开始导入
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  View,
  Refresh,
  TrendCharts,
  ArrowUp,
  ArrowDown,
  Calendar,
  Search,
  Download,
  Warning,
  InfoFilled,
  SuccessFilled,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'
import type { ImportRecord, ImportStatistics, ValidationResult } from '../../types/import'

// Props & Emits
defineEmits<{
  next: []
  prev: []
}>()

// Store
const importStore = useImportStore()

// 状态
const isRefreshing = ref(false)
const showCategoryDetail = ref(false)
const searchText = ref('')
const filterDirection = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const sortField = ref('')
const sortOrder = ref('')

// 计算属性
const parseResult = computed(() => importStore.parseResult)
const categoryMapping = computed(() => importStore.categoryMapping)
const availableCategories = computed(() => importStore.availableCategories)

const previewData = computed(() => {
  if (!parseResult.value?.data || !categoryMapping.value) return []
  
  return parseResult.value.data.map((record, index) => {
    const mappedCategoryId = categoryMapping.value?.mappings[record.category]
    const mappedCategory = availableCategories.value.find(cat => cat.id === mappedCategoryId)
    
    // 根据分类类型判断收支方向，而不是金额正负
    let direction = record.direction
    if (!direction && mappedCategory) {
      direction = mappedCategory.type === 'INCOME' ? 'income' : 'expense'
    } else if (!direction) {
      // 如果没有映射分类，则根据金额判断（备用逻辑）
      direction = record.amount > 0 ? 'income' : 'expense'
    }
    
    return {
      ...record,
      index,
      mappedCategory: mappedCategoryId,
      mappedCategoryName: mappedCategory?.name || record.category,
      direction
    }
  })
})

const statistics = computed(() => {
  const data = previewData.value
  if (!data.length) {
    return {
      totalRecords: 0,
      incomeRecords: 0,
      expenseRecords: 0,
      totalAmount: 0,
      incomeAmount: 0,
      expenseAmount: 0,
      dateRange: { start: '', end: '' },
      categories: {}
    }
  }

  const incomeRecords = data.filter(r => r.direction === 'income')
  const expenseRecords = data.filter(r => r.direction === 'expense')
  
  const incomeAmount = incomeRecords.reduce((sum, r) => sum + Math.abs(r.amount), 0)
  const expenseAmount = expenseRecords.reduce((sum, r) => sum + Math.abs(r.amount), 0)
  
  const dates = data.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime())
  const dateRange = {
    start: dates[0]?.toLocaleDateString() || '',
    end: dates[dates.length - 1]?.toLocaleDateString() || ''
  }
  
  const categories: Record<string, any> = {}
  data.forEach(record => {
    const categoryName = record.mappedCategoryName
    if (!categories[categoryName]) {
      categories[categoryName] = {
        name: categoryName,
        count: 0,
        amount: 0
      }
    }
    categories[categoryName].count++
    categories[categoryName].amount += Math.abs(record.amount)
  })

  return {
    totalRecords: data.length,
    incomeRecords: incomeRecords.length,
    expenseRecords: expenseRecords.length,
    totalAmount: incomeAmount + expenseAmount,
    incomeAmount,
    expenseAmount,
    dateRange,
    categories
  }
})

const validation = computed(() => {
  const errors: any[] = []
  const warnings: any[] = []
  
  previewData.value.forEach((record, index) => {
    // 验证日期
    if (!record.date || isNaN(new Date(record.date).getTime())) {
      errors.push({
        index,
        field: 'date',
        value: record.date,
        message: '日期格式无效'
      })
    }
    
    // 验证金额
    if (typeof record.amount !== 'number' || isNaN(record.amount)) {
      errors.push({
        index,
        field: 'amount',
        value: record.amount,
        message: '金额必须是数字'
      })
    } else if (record.amount === 0) {
      warnings.push({
        index,
        field: 'amount',
        value: record.amount,
        message: '金额为零'
      })
    }
    
    // 验证描述
    if (!record.description || record.description.trim() === '') {
      warnings.push({
        index,
        field: 'description',
        value: record.description,
        message: '描述为空'
      })
    }
    
    // 验证分类
    if (!record.mappedCategory) {
      warnings.push({
        index,
        field: 'category',
        value: record.category,
        message: '未映射到有效分类'
      })
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
})

const categoryStats = computed(() => {
  return Object.values(statistics.value.categories).map((cat: any) => ({
    ...cat,
    percentage: Math.round((cat.count / statistics.value.totalRecords) * 100)
  })).sort((a, b) => b.count - a.count)
})

const displayData = computed(() => {
  let data = [...previewData.value]
  
  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    data = data.filter(record => 
      record.description.toLowerCase().includes(search) ||
      record.mappedCategoryName.toLowerCase().includes(search) ||
      record.amount.toString().includes(search)
    )
  }
  
  // 收支类型过滤
  if (filterDirection.value) {
    data = data.filter(record => record.direction === filterDirection.value)
  }
  
  // 排序
  if (sortField.value && sortOrder.value) {
    data.sort((a, b) => {
      let aVal = a[sortField.value as keyof typeof a]
      let bVal = b[sortField.value as keyof typeof b]
      
      if (sortField.value === 'date') {
        aVal = new Date(aVal as string).getTime()
        bVal = new Date(bVal as string).getTime()
      }
      
      if (sortOrder.value === 'ascending') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }
  
  return data
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return displayData.value.slice(start, end)
})

const dateRangeText = computed(() => {
  const range = statistics.value.dateRange
  if (!range.start || !range.end) return '无数据'
  if (range.start === range.end) return range.start
  return `${range.start} ~ ${range.end}`
})

const canProceed = computed(() => {
  return validation.value.isValid && statistics.value.totalRecords > 0
})

// 方法
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString('zh-CN')
  } catch {
    return date
  }
}

const getCategoryTagType = (categoryName: string) => {
  if (!categoryName) return 'info'
  const types = ['info', 'success', 'warning', 'danger']
  const hash = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return types[hash % types.length]
}

const hasFieldError = (rowIndex: number, field: string): boolean => {
  return validation.value.errors.some(error => 
    error.index === rowIndex && error.field === field
  )
}

const hasRowError = (rowIndex: number): boolean => {
  return validation.value.errors.some(error => error.index === rowIndex)
}

const hasRowWarning = (rowIndex: number): boolean => {
  return validation.value.warnings.some(warning => warning.index === rowIndex)
}

const refreshPreview = async () => {
  isRefreshing.value = true
  try {
    // 刷新分类映射
    await importStore.generateInitialCategoryMapping()
    ElMessage.success('预览已刷新')
  } catch (error) {
    console.error('刷新预览失败:', error)
    ElMessage.error('刷新预览失败')
  } finally {
    isRefreshing.value = false
  }
}

const exportPreview = () => {
  try {
    const data = displayData.value
    const headers = ['日期', '描述', '金额', '收支类型', '分类', '预算']
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.date,
        `"${record.description}"`,
        record.amount,
        record.direction === 'income' ? '收入' : '支出',
        `"${record.mappedCategoryName}"`,
        `"${record.budget || ''}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `导入预览_${new Date().toLocaleDateString()}.csv`
    link.click()
    
    ElMessage.success('预览数据已导出')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const handleSort = ({ prop, order }: { prop: string, order: string }) => {
  sortField.value = prop
  sortOrder.value = order
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}

// 监听
watch([searchText, filterDirection], () => {
  currentPage.value = 1
})

onMounted(() => {
  // 组件加载时刷新一次预览
  refreshPreview()
})
</script>

<style scoped>
.data-preview {
  padding: 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.statistics-section {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.income {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.expense {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-icon.date {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.stat-amount {
  font-size: 12px;
  color: #67c23a;
  font-weight: 500;
}

.validation-section {
  margin-bottom: 24px;
}

.validation-content p {
  margin-bottom: 8px;
}

.error-list,
.warning-list {
  margin: 0;
  padding-left: 20px;
}

.error-list li,
.warning-list li {
  margin-bottom: 4px;
  font-size: 13px;
}

.warning-alert {
  margin-top: 12px;
}

.category-section {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  margin: 0;
}

.data-table-section {
  margin-bottom: 24px;
}

.table-actions {
  display: flex;
  align-items: center;
}

.error-field {
  color: #f56c6c !important;
  background-color: #fef0f0;
  padding: 2px 4px;
  border-radius: 3px;
}

.amount-income {
  color: #67c23a;
  font-weight: 500;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 500;
}

.budget-info {
  font-size: 12px;
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 4px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 24px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stat-content .stat-value {
    font-size: 20px;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .preview-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style> 