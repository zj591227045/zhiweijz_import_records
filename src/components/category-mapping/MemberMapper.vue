<template>
  <div class="member-mapper">
    <div class="mapper-header">
      <h3>成员映射配置</h3>
      <p>将您文件中的成员名映射到系统成员</p>
    </div>

    <div class="mapping-overview">
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-value">{{ originalMembers.length }}</span>
          <span class="stat-label">检测到的成员</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ mappedMembers.length }}</span>
          <span class="stat-label">已映射成员</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ unmappedMembers.length }}</span>
          <span class="stat-label">待映射成员</span>
        </div>
      </div>

      <div class="quick-actions">
        <el-button 
          type="primary" 
          @click="autoMapMembers"
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

    <div class="mapping-content" v-if="originalMembers.length > 0">
      <!-- 映射列表 -->
      <div class="mapping-list">
        <div 
          v-for="originalMember in originalMembers" 
          :key="originalMember"
          class="mapping-item"
          :class="{ 'unmapped': !currentMappings[originalMember] }"
        >
          <div class="original-member">
            <div class="member-info">
              <span class="member-name">{{ originalMember }}</span>
              <span class="record-count">({{ getMemberRecordCount(originalMember) }} 条记录)</span>
            </div>
          </div>

          <div class="mapping-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>

          <div class="target-member">
            <el-select 
              v-model="currentMappings[originalMember]" 
              placeholder="选择目标成员"
              filterable
              clearable
              allow-create
              @change="handleMappingChange(originalMember, $event)"
            >
              <el-option
                v-for="member in availableMembers"
                :key="member.id"
                :label="member.name"
                :value="member.id"
              >
                <span style="float: left">{{ member.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">
                  {{ member.role || '成员' }}
                </span>
              </el-option>
            </el-select>

            <!-- 映射建议 -->
            <div v-if="getMemberSuggestions(originalMember).length > 0" class="mapping-suggestions">
              <span class="suggestions-label">智能建议:</span>
              <div class="suggestion-buttons">
                <el-button
                  v-for="suggestion in getMemberSuggestions(originalMember)"
                  :key="suggestion.id"
                  type="text"
                  size="small"
                  @click="applyMemberSuggestion(originalMember, suggestion.id)"
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

    <div v-else class="no-members">
      <el-empty 
        description="文件中未检测到成员信息"
        :image-size="100"
      >
        <el-button type="primary" @click="$emit('skip')">
          跳过成员映射
        </el-button>
      </el-empty>
    </div>

    <!-- 操作按钮 -->
    <div class="mapping-actions" v-if="originalMembers.length > 0">
      <div class="actions-left">
        <el-button @click="$emit('skip')" type="text">
          跳过成员映射
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
const originalMembers = computed(() => {
  const data = importStore.parseResult?.data || []
  return [...new Set(data.map((record: any) => record.member).filter(Boolean))]
})

const mappedMembers = computed(() => {
  return originalMembers.value.filter(member => currentMappings.value[member])
})

const unmappedMembers = computed(() => {
  return originalMembers.value.filter(member => !currentMappings.value[member])
})

const availableMembers = computed(() => {
  // 这里应该从API获取系统成员列表，临时使用示例数据
  return [
    { id: 'member_1', name: '自己', role: '默认' },
    { id: 'member_2', name: '配偶', role: '家庭' },
    { id: 'member_3', name: '孩子', role: '家庭' },
    { id: 'member_4', name: '父母', role: '家庭' }
  ]
})

const canProceed = computed(() => {
  // 检查是否所有成员都已映射，或者用户选择跳过
  return originalMembers.value.length === 0 || 
         originalMembers.value.every(member => currentMappings.value[member])
})

// 方法
const getMemberRecordCount = (member: string) => {
  const data = importStore.parseResult?.data || []
  return data.filter((record: any) => record.member === member).length
}

const getMemberSuggestions = (originalMember: string) => {
  if (!originalMember) return []
  
  // 简单的成员匹配逻辑
  const suggestions = availableMembers.value.filter(member => {
    const memberName = member.name.toLowerCase()
    const originalName = originalMember.toLowerCase()
    
    // 包含匹配
    return memberName.includes(originalName) || originalName.includes(memberName)
  })
  
  return suggestions.slice(0, 3)
}

const applyMemberSuggestion = (originalMember: string, targetMemberId: string) => {
  currentMappings.value[originalMember] = targetMemberId
  handleMappingChange(originalMember, targetMemberId)
}

const autoMapMembers = async () => {
  isAutoMapping.value = true
  
  try {
    // 清除现有映射
    currentMappings.value = {}
    
    // 为每个原始成员找到最佳匹配
    for (const originalMember of originalMembers.value) {
      const suggestions = getMemberSuggestions(originalMember)
      
      if (suggestions.length > 0) {
        // 取置信度最高的匹配
        currentMappings.value[originalMember] = suggestions[0].id
        console.log(`成员匹配: "${originalMember}" -> "${suggestions[0].name}"`)
      } else {
        console.log(`未找到匹配的成员: "${originalMember}"`)
      }
    }
    
    updateStoreMappings()
    
    const mappedCount = Object.keys(currentMappings.value).length
    const totalCount = originalMembers.value.length
    ElMessage.success(`成员映射完成，成功映射 ${mappedCount}/${totalCount} 个成员`)
    
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
  ElMessage.info('已清除所有成员映射')
}

const handleMappingChange = (originalMember: string, targetMemberId: string | null) => {
  if (targetMemberId) {
    currentMappings.value[originalMember] = targetMemberId
  } else {
    delete currentMappings.value[originalMember]
  }
  updateStoreMappings()
}

const updateStoreMappings = () => {
  // 更新store中的成员映射
  const currentCategoryMapping = importStore.categoryMapping || { mappings: {}, unmappedCategories: [] }
  
  const updatedMapping = {
    ...currentCategoryMapping,
    memberMappings: { ...currentMappings.value },
    unmappedMembers: unmappedMembers.value
  }
  
  importStore.setCategoryMapping(updatedMapping)
}

const handleNext = () => {
  if (!canProceed.value) {
    ElMessage.warning('请完成所有成员的映射配置')
    return
  }
  
  updateStoreMappings()
  ElMessage.success('成员映射配置完成')
  emit('next')
}

// 初始化
onMounted(() => {
  // 如果已有成员映射配置，加载它
  if (importStore.categoryMapping?.memberMappings) {
    currentMappings.value = { ...importStore.categoryMapping.memberMappings }
  } else if (originalMembers.value.length > 0) {
    // 否则触发自动映射
    autoMapMembers()
  }
})
</script>

<style scoped>
.member-mapper {
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

.original-member {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
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

.target-member {
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

.no-members {
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
  .member-mapper {
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