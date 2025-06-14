<template>
  <div class="file-uploader">
    <div class="uploader-container">
      <!-- 文件上传区域 -->
      <div class="upload-section">
        <div class="upload-header">
          <div class="header-content">
            <h3>上传数据文件</h3>
            <p>支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式</p>
          </div>
          <el-button 
            type="info" 
            size="small"
            @click="showTemplateDialog = true"
          >
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>

        <el-upload
          ref="uploadRef"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :auto-upload="false"
          :show-file-list="false"
          drag
          :accept="acceptedFormats"
          :disabled="isLoading"
          class="file-upload-area"
        >
          <div class="upload-content">
            <el-icon class="upload-icon" size="48">
              <UploadFilled v-if="!uploadedFile" />
              <Document v-else />
            </el-icon>
            
            <div v-if="!uploadedFile" class="upload-text">
              <div class="upload-hint">拖拽文件到此处或<em>点击上传</em></div>
              <div class="upload-formats">支持格式: .xlsx, .xls, .csv (最大 10MB)</div>
            </div>
            
            <div v-else class="uploaded-file-info">
              <div class="file-name">{{ uploadedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
              <el-tag 
                :type="parseResult?.success ? 'success' : 'danger'"
                size="large"
              >
                {{ parseResult?.success ? '解析成功' : '解析失败' }}
              </el-tag>
            </div>
          </div>
        </el-upload>

        <!-- 文件操作按钮 -->
        <div v-if="uploadedFile" class="file-actions">
          <el-button @click="clearFile" :disabled="isLoading">
            <el-icon><Delete /></el-icon>
            重新选择
          </el-button>
          
          <el-button 
            type="primary" 
            @click="parseFile" 
            :loading="isLoading"
            v-if="!parseResult"
          >
            <el-icon><Reading /></el-icon>
            解析文件
          </el-button>
        </div>
      </div>

      <!-- 解析结果 -->
      <div v-if="parseResult" class="parse-result-section">
        <!-- 成功结果 -->
        <div v-if="parseResult.success" class="parse-success">
          <el-alert
            title="文件解析成功"
            type="success"
            :show-icon="true"
            :closable="false"
          >
            <p>成功解析 {{ parseResult.data.length }} 条记录</p>
          </el-alert>

          <!-- 数据统计 -->
          <div class="data-statistics">
            <div class="stat-cards">
              <div class="stat-card">
                <div class="stat-icon income">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ incomeCount }}</div>
                  <div class="stat-label">收入记录</div>
                  <div class="stat-amount income">+{{ formatAmount(incomeAmount) }}</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon expense">
                  <el-icon><Minus /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ expenseCount }}</div>
                  <div class="stat-label">支出记录</div>
                  <div class="stat-amount expense">-{{ formatAmount(expenseAmount) }}</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon category">
                  <el-icon><Collection /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ uniqueCategories.length }}</div>
                  <div class="stat-label">分类数量</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon date">
                  <el-icon><Calendar /></el-icon>
                </div>
                <div class="stat-content">
                  <div v-if="dateRange.single" class="stat-value single-date">{{ dateRange.single }}</div>
                  <div v-else class="date-range-content">
                    <div class="date-range-item">
                      <span class="date-label">开始</span>
                      <span class="date-value">{{ dateRange.start }}</span>
                    </div>
                    <div class="date-range-item">
                      <span class="date-label">结束</span>
                      <span class="date-value">{{ dateRange.end }}</span>
                    </div>
                  </div>
                  <div class="stat-label">日期范围</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据预览 -->
          <div class="data-preview">
            <div class="preview-header">
              <h4>数据预览 (前 5 条记录)</h4>
              <el-button 
                type="primary" 
                size="small"
                @click="showFullPreview = true"
              >
                查看全部数据
              </el-button>
            </div>
            
            <el-table 
              :data="previewData" 
              border
              size="small"
              class="preview-table"
            >
              <el-table-column prop="date" label="日期" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="150" />
              <el-table-column prop="amount" label="金额" width="100" align="right">
                <template #default="{ row }">
                  {{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="direction" label="类型" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.direction === 'income' ? 'success' : 'danger'" size="small">
                    {{ row.direction === 'income' ? '收入' : '支出' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="分类" width="120" />
              <el-table-column prop="member" label="成员" width="100" v-if="hasMembers" />
            </el-table>
          </div>

          <!-- 检测到的字段映射 -->
          <div class="field-mapping">
            <h4>检测到的字段映射</h4>
            <div class="mapping-grid">
              <div class="mapping-item">
                <span class="field-label">日期字段:</span>
                <el-tag size="small">{{ detectedFields.date || '未检测到' }}</el-tag>
              </div>
              <div class="mapping-item">
                <span class="field-label">金额字段:</span>
                <el-tag size="small">{{ detectedFields.amount || '未检测到' }}</el-tag>
              </div>
              <div class="mapping-item">
                <span class="field-label">描述字段:</span>
                <el-tag size="small">{{ detectedFields.description || '未检测到' }}</el-tag>
              </div>
              <div class="mapping-item">
                <span class="field-label">分类字段:</span>
                <el-tag size="small">{{ detectedFields.category || '未检测到' }}</el-tag>
              </div>
            </div>
          </div>

          <!-- 下一步操作按钮 -->
          <div class="next-step-actions">
            <el-button 
              type="primary" 
              size="large"
              @click="$emit('next')"
            >
              <el-icon><ArrowRight /></el-icon>
              继续配置分类映射
            </el-button>
            
            <el-button 
              @click="clearFile"
              size="large"
            >
              <el-icon><Refresh /></el-icon>
              重新选择文件
            </el-button>
          </div>
        </div>

        <!-- 错误结果 -->
        <div v-else class="parse-error">
          <el-alert
            title="文件解析失败"
            type="error"
            :show-icon="true"
            :closable="false"
          >
            <p>发现 {{ parseResult.errors.length }} 个错误</p>
          </el-alert>

          <!-- 错误详情 -->
          <div class="error-details">
            <h4>错误详情</h4>
            <div class="error-list">
              <div 
                v-for="(error, index) in parseResult.errors.slice(0, 10)" 
                :key="index"
                class="error-item"
              >
                <div class="error-row">第 {{ error.row }} 行</div>
                <div class="error-field">{{ error.field }}</div>
                <div class="error-message">{{ error.message }}</div>
              </div>
            </div>
            
            <div v-if="parseResult.errors.length > 10" class="error-more">
              还有 {{ parseResult.errors.length - 10 }} 个错误未显示
            </div>
          </div>

          <!-- 修复建议 -->
          <div class="fix-suggestions">
            <h4>修复建议</h4>
            <ul>
              <li>请确保文件包含必要的字段：日期、金额</li>
              <li>检查日期格式是否正确 (如: 2024-01-01)</li>
              <li>检查金额格式是否为数字</li>
              <li>确保文件编码为 UTF-8</li>
              <li>如果是 Excel 文件，请确保数据在第一个工作表中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 完整数据预览弹窗 -->
    <el-dialog
      v-model="showFullPreview"
      title="完整数据预览"
      width="90%"
      top="5vh"
    >
      <div class="full-preview-content">
        <div class="preview-toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索记录..."
            size="small"
            style="width: 200px; margin-right: 1rem;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="filterType"
            placeholder="筛选类型"
            size="small"
            style="width: 120px; margin-right: 1rem;"
          >
            <el-option label="全部" value="" />
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
          
          <el-button size="small" @click="exportPreviewData">
            <el-icon><Download /></el-icon>
            导出预览
          </el-button>
        </div>

        <el-table 
          :data="filteredPreviewData" 
          border
          height="400"
          size="small"
        >
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="date" label="日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="direction" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.direction === 'income' ? 'success' : 'danger'" size="small">
                {{ row.direction === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="member" label="成员" width="100" v-if="hasMembers" />
          <el-table-column prop="note" label="备注" min-width="150" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 模板下载弹窗 -->
    <TemplateDownload v-model="showTemplateDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled,
  Document,
  Delete,
  Reading,
  TrendCharts,
  Minus,
  Collection,
  Calendar,
  Search,
  Download,
  ArrowRight,
  Refresh
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'
import { FileParserFactory } from '../../utils/file-parser'
import dayjs from 'dayjs'
import type { ImportRecord, ParseResult } from '../../types/import'
import TemplateDownload from './TemplateDownload.vue'

// Store
const importStore = useImportStore()

// 状态
const uploadRef = ref()
const showFullPreview = ref(false)
const searchKeyword = ref('')
const filterType = ref('')
const showTemplateDialog = ref(false)

// 计算属性
const isLoading = computed(() => importStore.isLoading)
const uploadedFile = computed(() => importStore.uploadedFile)
const parseResult = computed(() => importStore.parseResult)

const acceptedFormats = computed(() => {
  return FileParserFactory.getSupportedFormats().join(',')
})

const previewData = computed(() => {
  return parseResult.value?.data?.slice(0, 5) || []
})

const incomeCount = computed(() => {
  return parseResult.value?.data?.filter(record => record.direction === 'income').length || 0
})

const expenseCount = computed(() => {
  return parseResult.value?.data?.filter(record => record.direction === 'expense').length || 0
})

const incomeAmount = computed(() => {
  const incomeRecords = parseResult.value?.data?.filter(record => record.direction === 'income') || []
  return incomeRecords.reduce((sum, record) => sum + Math.abs(record.amount), 0)
})

const expenseAmount = computed(() => {
  const expenseRecords = parseResult.value?.data?.filter(record => record.direction === 'expense') || []
  return expenseRecords.reduce((sum, record) => sum + Math.abs(record.amount), 0)
})

const uniqueCategories = computed(() => {
  const categories = parseResult.value?.data?.map(record => record.category).filter(Boolean) || []
  return [...new Set(categories)]
})

const dateRange = computed(() => {
  const data = parseResult.value?.data || []
  if (data.length === 0) return { start: '', end: '', single: '无数据' }
  
  const dates = data.map(record => dayjs(record.date)).filter(d => d.isValid())
  if (dates.length === 0) return { start: '', end: '', single: '无有效日期' }
  
  // 找到最小和最大日期
  let minDate = dates[0]
  let maxDate = dates[0]
  
  dates.forEach(date => {
    if (date.isBefore(minDate)) minDate = date
    if (date.isAfter(maxDate)) maxDate = date
  })
  
  if (minDate.isSame(maxDate, 'day')) {
    return { start: '', end: '', single: minDate.format('YYYY-MM-DD') }
  }
  
  return { 
    start: minDate.format('YYYY-MM-DD'), 
    end: maxDate.format('YYYY-MM-DD'),
    single: ''
  }
})

const detectedFields = computed(() => {
  const metadata = parseResult.value?.metadata
  if (!metadata?.headers) return {}
  
  const headers = metadata.headers
  
  return {
    date: headers.find(h => /日期|date/i.test(h)) || '',
    amount: headers.find(h => /金额|amount|money/i.test(h)) || '',
    description: headers.find(h => /描述|description|摘要|summary/i.test(h)) || '',
    category: headers.find(h => /分类|category|类别/i.test(h)) || ''
  }
})

const hasMembers = computed(() => {
  const data = parseResult.value?.data || []
  return data.some((record: any) => record.member)
})

const filteredPreviewData = computed(() => {
  let data = parseResult.value?.data || []
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(record => 
      record.description?.toLowerCase().includes(keyword) ||
      record.category?.toLowerCase().includes(keyword) ||
      record.notes?.toLowerCase().includes(keyword) ||
      record.member?.toLowerCase().includes(keyword)
    )
  }
  
  // 类型过滤
  if (filterType.value) {
    data = data.filter(record => record.direction === filterType.value)
  }
  
  return data
})

// 方法
const beforeUpload = (file: File) => {
  // 检查文件格式
  if (!FileParserFactory.isSupported(file)) {
    ElMessage.error('不支持的文件格式，请选择 Excel 或 CSV 文件')
    return false
  }
  
  // 检查文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  return false // 阻止自动上传
}

const handleFileChange = async (file: any) => {
  if (file.raw) {
    try {
      await importStore.setUploadedFile(file.raw)
      if (parseResult.value?.success) {
        ElMessage.success('文件上传并解析成功')
      }
    } catch (error) {
      ElMessage.error('文件处理失败')
    }
  }
}

const clearFile = () => {
  importStore.resetFromStep(2)
  uploadRef.value?.clearFiles()
}

const parseFile = async () => {
  if (uploadedFile.value) {
    try {
      await importStore.setUploadedFile(uploadedFile.value)
    } catch (error) {
      ElMessage.error('文件解析失败')
    }
  }
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (date: Date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

const exportPreviewData = () => {
  const data = filteredPreviewData.value
  if (data.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 简单的CSV导出
  const csvContent = [
    ['日期', '描述', '金额', '类型', '分类', '备注'].join(','),
    ...data.map(record => [
      formatDate(record.date),
      `"${record.description || ''}"`,
      record.amount,
      record.direction === 'income' ? '收入' : '支出',
      `"${record.category || ''}"`,
      `"${record.notes || ''}"`
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `preview_data_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

// 事件
const emit = defineEmits<{
  next: []
  prev: []
}>()

// 移除自动跳转逻辑，让用户手动确认后进行下一步
// watch(parseResult, (newResult) => {
//   if (newResult?.success) {
//     emit('next')
//   }
// }, { deep: true })
</script>

<style scoped>
.file-uploader {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 2rem;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 0;
}

.header-content {
  text-align: center;
  flex: 1;
}

.upload-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.upload-header p {
  margin: 0;
  color: #6b7280;
}

.file-upload-area {
  margin-bottom: 1rem;
}

:deep(.el-upload-dragger) {
  padding: 3rem 2rem;
  border-radius: 12px;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

.upload-content {
  text-align: center;
}

.upload-icon {
  color: #409eff;
  margin-bottom: 1rem;
}

.upload-text .upload-hint {
  font-size: 1.125rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.upload-text .upload-hint em {
  color: #409eff;
  font-style: normal;
}

.upload-text .upload-formats {
  font-size: 0.875rem;
  color: #9ca3af;
}

.uploaded-file-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.file-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
}

.file-size {
  color: #6b7280;
  font-size: 0.875rem;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* 解析结果 */
.parse-result-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  background: white;
}

/* 数据统计 */
.data-statistics {
  margin: 1.5rem 0;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.income {
  background: #10b981;
}

.stat-icon.expense {
  background: #ef4444;
}

.stat-icon.category {
  background: #8b5cf6;
}

.stat-icon.date {
  background: #f59e0b;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-amount {
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.stat-amount.income {
  color: #10b981;
}

.stat-amount.expense {
  color: #ef4444;
}

/* 日期范围样式 */
.date-range-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-range-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.date-label {
  color: #6b7280;
  font-size: 0.75rem;
  min-width: 2rem;
}

.date-value {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.875rem;
}

.single-date {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

/* 数据预览 */
.data-preview {
  margin: 1.5rem 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-header h4 {
  margin: 0;
  color: #1f2937;
}

.preview-table {
  margin-bottom: 1rem;
}

/* 字段映射 */
.field-mapping {
  margin-top: 1.5rem;
}

.field-mapping h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.mapping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: #374151;
}

/* 下一步操作区域 */
.next-step-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.next-step-actions .el-button {
  min-width: 160px;
}

/* 错误显示 */
.error-details {
  margin: 1.5rem 0;
}

.error-details h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.error-list {
  border: 1px solid #fecaca;
  border-radius: 8px;
  overflow: hidden;
}

.error-item {
  display: grid;
  grid-template-columns: 80px 120px 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #fecaca;
  background: #fef2f2;
  font-size: 0.875rem;
}

.error-item:last-child {
  border-bottom: none;
}

.error-row {
  font-weight: 600;
  color: #dc2626;
}

.error-field {
  color: #374151;
}

.error-message {
  color: #6b7280;
}

.error-more {
  margin-top: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

/* 修复建议 */
.fix-suggestions {
  margin-top: 1.5rem;
}

.fix-suggestions h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.fix-suggestions ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #6b7280;
}

.fix-suggestions li {
  margin-bottom: 0.5rem;
}

/* 完整预览 */
.full-preview-content {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 响应式 */
@media (max-width: 768px) {
  .file-uploader {
    padding: 1rem;
  }
  
  .stat-cards {
    grid-template-columns: 1fr;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .mapping-grid {
    grid-template-columns: 1fr;
  }
  
  .error-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .preview-toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style> 