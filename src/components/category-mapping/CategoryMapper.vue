<template>
  <div class="category-mapper">
    <div class="mapper-header">
      <h3>分类映射配置</h3>
      <p>将您文件中的分类映射到系统预设分类</p>
    </div>

    <div class="mapping-overview">
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-value">{{ originalCategories.length }}</span>
          <span class="stat-label">检测到的分类</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ mappedCategories.length }}</span>
          <span class="stat-label">已映射分类</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ unmappedCategories.length }}</span>
          <span class="stat-label">待映射分类</span>
        </div>
      </div>

      <div class="quick-actions">
        <el-button 
          type="primary" 
          @click="autoMapCategories"
          :loading="isAutoMapping"
        >
          <el-icon><MagicStick /></el-icon>
          智能映射
        </el-button>
        <el-button @click="clearAllMappings">
          <el-icon><Refresh /></el-icon>
          清除映射
        </el-button>
      </div>
    </div>

    <div class="mapping-content">
      <!-- 映射列表 -->
      <div class="mapping-list">
        <div 
          v-for="originalCategory in originalCategories" 
          :key="originalCategory"
          class="mapping-item"
          :class="{ 'unmapped': !currentMappings[originalCategory] }"
        >
          <div class="original-category">
            <div class="category-info">
              <span class="category-name">{{ originalCategory }}</span>
              <span class="record-count">({{ getCategoryRecordCount(originalCategory) }} 条记录)</span>
            </div>
            <div class="category-type">
              <el-tag :type="getCategoryType(originalCategory) === 'income' ? 'success' : 'danger'" size="small">
                {{ getCategoryType(originalCategory) === 'income' ? '收入' : '支出' }}
              </el-tag>
            </div>
          </div>

          <div class="mapping-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>

          <div class="target-category">
            <el-select 
              v-model="currentMappings[originalCategory]" 
              placeholder="选择目标分类"
              filterable
              clearable
              @change="handleMappingChange(originalCategory, $event)"
            >
              <el-option-group
                v-for="group in groupedSystemCategories"
                :key="group.type"
                :label="group.label"
              >
                <el-option
                  v-for="category in group.categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                >
                  <span style="float: left">{{ category.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ category.icon }}
                  </span>
                </el-option>
              </el-option-group>
            </el-select>

                         <!-- 映射建议 -->
             <div v-if="getMappingSuggestions(originalCategory).length > 0" class="mapping-suggestions">
               <span class="suggestions-label">智能建议:</span>
               <div class="suggestion-buttons">
                 <el-button
                   v-for="suggestion in getMappingSuggestions(originalCategory)"
                   :key="suggestion.id"
                   type="text"
                   size="small"
                   @click="applyMappingSuggestion(originalCategory, suggestion.id)"
                   class="suggestion-btn"
                   :class="getConfidenceClass(suggestion.confidence)"
                 >
                   <span class="suggestion-name">{{ suggestion.name }}</span>
                   <div class="suggestion-meta">
                     <span class="confidence-score">{{ Math.round(suggestion.confidence * 100) }}%</span>
                     <span class="match-type">{{ getMatchTypeLabel(suggestion.matchType) }}</span>
                   </div>
                   <el-icon class="suggestion-icon"><Check /></el-icon>
                 </el-button>
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- 未使用的系统分类 -->
      <div class="unused-categories" v-if="showUnusedCategories">
        <h4>
          <el-icon><Collection /></el-icon>
          未使用的系统分类
        </h4>
        <div class="unused-category-list">
          <el-tag
            v-for="category in unusedSystemCategories"
            :key="category.id"
            :type="category.type === 'INCOME' ? 'success' : 'danger'"
            size="small"
            class="unused-category-tag"
          >
            {{ category.icon }} {{ category.name }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="mapping-actions">
      <div class="actions-left">
        <el-checkbox v-model="showUnusedCategories">
          显示未使用的系统分类
        </el-checkbox>
      </div>
      
      <div class="actions-right">
        <el-button @click="$emit('prev')" size="large">
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>
        
        <el-button 
          type="primary" 
          @click="handleNext"
          :disabled="!canProceed"
          size="large"
        >
          <el-icon><Check /></el-icon>
          确认映射并继续
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  Refresh,
  ArrowRight,
  ArrowLeft,
  Check,
  Collection
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'
import type { Category } from '../../types/api'
import { createCategoryMatcher, type MatchResult } from '../../utils/category-matcher'

// Props & Emits
const emit = defineEmits<{
  next: []
  prev: []
}>()

// Store
const importStore = useImportStore()

// 状态
const showUnusedCategories = ref(false)
const isAutoMapping = ref(false)
const currentMappings = ref<Record<string, string>>({})

// 计算属性
const originalCategories = computed(() => {
  const data = importStore.parseResult?.data || []
  return [...new Set(data.map(record => record.category).filter(Boolean))]
})

const mappedCategories = computed(() => {
  return originalCategories.value.filter(cat => currentMappings.value[cat])
})

const unmappedCategories = computed(() => {
  return originalCategories.value.filter(cat => !currentMappings.value[cat])
})

const systemCategories = computed(() => importStore.availableCategories)

const groupedSystemCategories = computed(() => {
  const incomeCategories = systemCategories.value.filter(cat => cat.type === 'INCOME')
  const expenseCategories = systemCategories.value.filter(cat => cat.type === 'EXPENSE')
  
  return [
    {
      type: 'INCOME',
      label: '收入分类',
      categories: incomeCategories
    },
    {
      type: 'EXPENSE', 
      label: '支出分类',
      categories: expenseCategories
    }
  ]
})

const unusedSystemCategories = computed(() => {
  const mappedCategoryIds = Object.values(currentMappings.value).filter(Boolean)
  return systemCategories.value.filter(cat => !mappedCategoryIds.includes(cat.id))
})

const canProceed = computed(() => {
  // 检查是否所有分类都已映射
  return originalCategories.value.every(cat => currentMappings.value[cat])
})

// 方法
const getCategoryRecordCount = (category: string) => {
  const data = importStore.parseResult?.data || []
  return data.filter((record: any) => record.category === category).length
}

const getCategoryType = (category: string): 'income' | 'expense' => {
  const data = importStore.parseResult?.data || []
  const records = data.filter((record: any) => record.category === category)
  const incomeCount = records.filter((record: any) => record.direction === 'income').length
  const expenseCount = records.filter((record: any) => record.direction === 'expense').length
  
  return incomeCount > expenseCount ? 'income' : 'expense'
}

const getMappingSuggestions = (originalCategory: string): Array<Category & { confidence: number; matchType: string }> => {
  if (!originalCategory) return []
  
  const categoryType = getCategoryType(originalCategory)
  const matcher = createCategoryMatcher(systemCategories.value)
  
  // 使用新的智能匹配器获取建议
  const matchResults = matcher.match(originalCategory, categoryType)
  
  // 转换为Category对象并添加置信度信息
  return matchResults
    .slice(0, 3)
    .map(result => {
      const category = systemCategories.value.find(cat => cat.id === result.categoryId)
      if (category) {
        return {
          ...category,
          confidence: result.confidence,
          matchType: result.matchType
        }
      }
      return null
    })
    .filter(Boolean) as Array<Category & { confidence: number; matchType: string }>
}



const applyMappingSuggestion = (originalCategory: string, targetCategoryId: string) => {
  currentMappings.value[originalCategory] = targetCategoryId
  handleMappingChange(originalCategory, targetCategoryId)
}

const getConfidenceClass = (confidence: number): string => {
  if (confidence >= 0.9) return 'confidence-high'
  if (confidence >= 0.7) return 'confidence-medium'
  return 'confidence-low'
}

const getMatchTypeLabel = (matchType: string): string => {
  const labels: Record<string, string> = {
    'exact': '精确',
    'fuzzy': '模糊',
    'semantic': '语义',
    'keyword': '关键词',
    'phonetic': '拼音'
  }
  return labels[matchType] || matchType
}

const autoMapCategories = async () => {
  isAutoMapping.value = true
  
  try {
    // 清除现有映射
    currentMappings.value = {}
    const matcher = createCategoryMatcher(systemCategories.value)
    
    // 为每个原始分类找到最佳匹配
    for (const originalCategory of originalCategories.value) {
      const categoryType = getCategoryType(originalCategory)
      const bestMatch = matcher.getBestMatch(originalCategory, categoryType)
      
      // 进一步降低阈值，确保"早饭"、"超市"等常用词能匹配
      if (bestMatch && bestMatch.confidence > 0.3) {
        currentMappings.value[originalCategory] = bestMatch.categoryId
        console.log(`匹配成功: "${originalCategory}" -> "${bestMatch.categoryName}" (置信度: ${bestMatch.confidence.toFixed(2)}, 类型: ${bestMatch.matchType})`)
      } else {
        console.log(`未找到匹配: "${originalCategory}" (最佳匹配: ${bestMatch ? `${bestMatch.categoryName} (${bestMatch.confidence.toFixed(2)})` : '无'})`)
      }
    }
    
    updateStoreMappings()
    
    const mappedCount = Object.keys(currentMappings.value).length
    const totalCount = originalCategories.value.length
    ElMessage.success(`智能映射完成，成功映射 ${mappedCount}/${totalCount} 个分类`)
    
  } catch (error) {
    console.error('自动映射失败:', error)
    ElMessage.error('自动映射失败')
  } finally {
    isAutoMapping.value = false
  }
}

const clearAllMappings = () => {
  currentMappings.value = {}
  updateStoreMappings()
  ElMessage.info('已清除所有映射')
}

const handleMappingChange = (originalCategory: string, targetCategoryId: string | null) => {
  if (targetCategoryId) {
    currentMappings.value[originalCategory] = targetCategoryId
  } else {
    delete currentMappings.value[originalCategory]
  }
  updateStoreMappings()
}

const updateStoreMappings = () => {
  const mapping = {
    mappings: { ...currentMappings.value },
    unmappedCategories: unmappedCategories.value
  }
  importStore.setCategoryMapping(mapping)
}

const handleNext = () => {
  if (!canProceed.value) {
    ElMessage.warning('请完成所有分类的映射配置')
    return
  }
  
  updateStoreMappings()
  ElMessage.success('分类映射配置完成')
  emit('next')
}

// 初始化
onMounted(() => {
  // 如果已有映射配置，加载它
  if (importStore.categoryMapping?.mappings) {
    currentMappings.value = { ...importStore.categoryMapping.mappings }
  } else {
    // 否则触发自动映射
    autoMapCategories()
  }
})
</script>

<style scoped>
.category-mapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.mapper-header {
  text-align: center;
  margin-bottom: 2rem;
}

.mapper-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.mapper-header p {
  margin: 0;
  color: #6b7280;
}

/* 映射概览 */
.mapping-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.overview-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

/* 映射列表 */
.mapping-content {
  margin-bottom: 2rem;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mapping-item {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s;
}

.mapping-item.unmapped {
  border-color: #fbbf24;
  background: #fffbeb;
}

.original-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-name {
  font-weight: 600;
  color: #1f2937;
}

.record-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.mapping-arrow {
  color: #9ca3af;
  font-size: 1.25rem;
}

.target-category {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.target-category .el-select {
  width: 100%;
}

.mapping-suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestions-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.suggestion-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.suggestion-btn {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  position: relative;
  min-width: 120px;
}

.suggestion-btn:hover {
  background: #f3f4f6;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.suggestion-btn.confidence-high {
  border-color: #67c23a;
  background: #f0f9ff;
}

.suggestion-btn.confidence-medium {
  border-color: #e6a23c;
  background: #fffbf0;
}

.suggestion-btn.confidence-low {
  border-color: #f56c6c;
  background: #fef0f0;
}

.suggestion-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.suggestion-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.confidence-score {
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.confidence-high .confidence-score {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.confidence-medium .confidence-score {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.confidence-low .confidence-score {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.match-type {
  color: #6b7280;
  font-size: 0.7rem;
  padding: 0.125rem 0.25rem;
  background: #f3f4f6;
  border-radius: 3px;
}

.suggestion-icon {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
  transition: all 0.2s;
}

.suggestion-btn:hover .suggestion-icon {
  color: #409eff;
}

/* 未使用分类 */
.unused-categories {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f3f4f6;
  border-radius: 12px;
}

.unused-categories h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  color: #374151;
}

.unused-category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.unused-category-tag {
  cursor: default;
}

/* 操作按钮 */
.mapping-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.actions-right {
  display: flex;
  gap: 1rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .category-mapper {
    padding: 1rem;
  }
  
  .mapping-overview {
    flex-direction: column;
    gap: 1rem;
  }
  
  .overview-stats {
    gap: 1rem;
  }
  
  .mapping-item {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
  
  .mapping-arrow {
    transform: rotate(90deg);
  }
  
  .mapping-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .actions-right {
    justify-content: center;
  }
}
</style> 