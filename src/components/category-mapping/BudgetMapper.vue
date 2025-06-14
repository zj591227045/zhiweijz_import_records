<template>
  <div class="budget-mapper">
    <div class="mapper-header">
      <h3>预算映射配置</h3>
      <p>将您文件中的预算映射到系统预算</p>
    </div>

    <div class="mapping-overview">
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-value">{{ originalBudgets.length }}</span>
          <span class="stat-label">检测到的预算</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ mappedBudgets.length }}</span>
          <span class="stat-label">已映射预算</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ unmappedBudgets.length }}</span>
          <span class="stat-label">待映射预算</span>
        </div>
      </div>

      <div class="quick-actions">
        <el-button 
          type="primary" 
          @click="autoMapBudgets"
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

    <div class="mapping-content" v-if="originalBudgets.length > 0">
      <!-- 映射列表 -->
      <div class="mapping-list">
        <div 
          v-for="originalBudget in originalBudgets" 
          :key="originalBudget"
          class="mapping-item"
          :class="{ 'unmapped': !currentMappings[originalBudget] }"
        >
          <div class="original-budget">
            <div class="budget-info">
              <span class="budget-name">{{ originalBudget }}</span>
              <span class="record-count">({{ getBudgetRecordCount(originalBudget) }} 条记录)</span>
            </div>
          </div>

          <div class="mapping-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>

          <div class="target-budget">
            <el-select 
              v-model="currentMappings[originalBudget]" 
              placeholder="选择目标预算"
              filterable
              clearable
              allow-create
              @change="handleMappingChange(originalBudget, $event)"
            >
              <el-option-group
                v-for="group in groupedBudgets"
                :key="group.type"
                :label="group.label"
              >
                <el-option
                  v-for="budget in group.budgets"
                  :key="budget.id"
                  :label="budget.name"
                  :value="budget.id"
                >
                  <span style="float: left">{{ budget.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ budget.type === 'PERSONAL' ? '个人' : '通用' }}
                  </span>
                </el-option>
              </el-option-group>
            </el-select>

            <!-- 映射建议 -->
            <div v-if="getBudgetSuggestions(originalBudget).length > 0" class="mapping-suggestions">
              <span class="suggestions-label">智能建议:</span>
              <div class="suggestion-buttons">
                <el-button
                  v-for="suggestion in getBudgetSuggestions(originalBudget)"
                  :key="suggestion.id"
                  type="text"
                  size="small"
                  @click="applyBudgetSuggestion(originalBudget, suggestion.id)"
                  class="suggestion-btn"
                >
                  {{ suggestion.name }}
                  <el-icon class="suggestion-icon"><Check /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-budgets">
      <el-empty 
        description="文件中未检测到预算信息"
        :image-size="100"
      >
        <el-button type="primary" @click="$emit('skip')">
          跳过预算映射
        </el-button>
      </el-empty>
    </div>

    <!-- 操作按钮 -->
    <div class="mapping-actions" v-if="originalBudgets.length > 0">
      <div class="actions-left">
        <el-button @click="$emit('skip')" type="text">
          跳过预算映射
        </el-button>
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
  Check
} from '@element-plus/icons-vue'
import { useImportStore } from '../../stores/import'
import type { Budget } from '../../types/api'

// Props & Emits
const emit = defineEmits<{
  next: []
  prev: []
  skip: []
}>()

// Store
const importStore = useImportStore()

// 状态
const isAutoMapping = ref(false)
const currentMappings = ref<Record<string, string>>({})

// 计算属性
const originalBudgets = computed(() => {
  const data = importStore.parseResult?.data || []
  return [...new Set(data.map((record: any) => record.budget).filter(Boolean))]
})

const mappedBudgets = computed(() => {
  return originalBudgets.value.filter(budget => currentMappings.value[budget])
})

const unmappedBudgets = computed(() => {
  return originalBudgets.value.filter(budget => !currentMappings.value[budget])
})

const availableBudgets = computed(() => {
  return importStore.availableBudgets || []
})

const groupedBudgets = computed(() => {
  const personalBudgets = availableBudgets.value.filter((b: Budget) => b.type === 'PERSONAL')
  const sharedBudgets = availableBudgets.value.filter((b: Budget) => b.type === 'SHARED')
  
  return [
    {
      type: 'PERSONAL',
      label: '个人预算',
      budgets: personalBudgets
    },
    {
      type: 'SHARED', 
      label: '通用预算',
      budgets: sharedBudgets
    }
  ]
})

const canProceed = computed(() => {
  // 检查是否所有预算都已映射，或者用户选择跳过
  return originalBudgets.value.length === 0 || 
         originalBudgets.value.every(budget => currentMappings.value[budget])
})

// 方法
const getBudgetRecordCount = (budget: string) => {
  const data = importStore.parseResult?.data || []
  return data.filter((record: any) => record.budget === budget).length
}

const getBudgetSuggestions = (originalBudget: string): Budget[] => {
  if (!originalBudget) return []
  
  // 预算匹配逻辑
  const suggestions = availableBudgets.value.filter((budget: Budget) => {
    const budgetName = budget.name.toLowerCase()
    const originalName = originalBudget.toLowerCase()
    
    // 完全匹配
    if (budgetName === originalName) return true
    
    // 包含匹配
    if (budgetName.includes(originalName) || originalName.includes(budgetName)) return true
    
    // 个人预算特殊匹配逻辑
    if (budget.type === 'PERSONAL') {
      // 如果原始预算包含人名相关词汇
      const personalKeywords = ['自己', '我', '本人', '个人']
      if (personalKeywords.some(keyword => originalName.includes(keyword))) {
        return true
      }
    }
    
    return false
  })
  
  return suggestions.slice(0, 3)
}

const applyBudgetSuggestion = (originalBudget: string, targetBudgetId: string) => {
  currentMappings.value[originalBudget] = targetBudgetId
  handleMappingChange(originalBudget, targetBudgetId)
}

const autoMapBudgets = async () => {
  isAutoMapping.value = true
  
  try {
    // 清除现有映射
    currentMappings.value = {}
    
    // 为每个原始预算找到最佳匹配
    for (const originalBudget of originalBudgets.value) {
      const suggestions = getBudgetSuggestions(originalBudget)
      
      if (suggestions.length > 0) {
        // 取置信度最高的匹配
        currentMappings.value[originalBudget] = suggestions[0].id
        console.log(`预算匹配: "${originalBudget}" -> "${suggestions[0].name}"`)
      } else {
        console.log(`未找到匹配的预算: "${originalBudget}"`)
      }
    }
    
    updateStoreMappings()
    
    const mappedCount = Object.keys(currentMappings.value).length
    const totalCount = originalBudgets.value.length
    ElMessage.success(`预算映射完成，成功映射 ${mappedCount}/${totalCount} 个预算`)
    
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
  ElMessage.info('已清除所有预算映射')
}

const handleMappingChange = (originalBudget: string, targetBudgetId: string | null) => {
  if (targetBudgetId) {
    currentMappings.value[originalBudget] = targetBudgetId
  } else {
    delete currentMappings.value[originalBudget]
  }
  updateStoreMappings()
}

const updateStoreMappings = () => {
  // 更新store中的预算映射
  const currentCategoryMapping = importStore.categoryMapping || { mappings: {}, unmappedCategories: [] }
  
  const updatedMapping = {
    ...currentCategoryMapping,
    budgetMappings: { ...currentMappings.value },
    unmappedBudgets: unmappedBudgets.value
  }
  
  importStore.setCategoryMapping(updatedMapping)
}

const handleNext = () => {
  if (!canProceed.value) {
    ElMessage.warning('请完成所有预算的映射配置')
    return
  }
  
  updateStoreMappings()
  ElMessage.success('预算映射配置完成')
  emit('next')
}

// 初始化
onMounted(() => {
  // 如果已有预算映射配置，加载它
  if (importStore.categoryMapping?.budgetMappings) {
    currentMappings.value = { ...importStore.categoryMapping.budgetMappings }
  } else if (originalBudgets.value.length > 0) {
    // 否则触发自动映射
    autoMapBudgets()
  }
})
</script>

<style scoped>
.budget-mapper {
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

.original-budget {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.budget-name {
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

.target-budget {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mapping-suggestions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.suggestions-label {
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.suggestion-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.suggestion-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 6px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.suggestion-icon {
  font-size: 0.75rem;
  color: #10b981;
}

.no-budgets {
  display: flex;
  justify-content: center;
  padding: 3rem;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .budget-mapper {
    padding: 1rem;
  }
  
  .mapping-overview {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
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
  }
  
  .actions-right {
    width: 100%;
    justify-content: center;
  }
}
</style> 