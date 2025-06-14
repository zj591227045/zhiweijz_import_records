<template>
  <el-dialog
    v-model="visible"
    title="下载导入模板"
    width="700px"
    :z-index="3000"
    append-to-body
    @closed="handleClose"
  >
    <div class="template-download">
      <div class="template-options">
        <div class="template-card">
          <div class="template-header">
            <el-icon size="24" color="#409EFF">
              <Document />
            </el-icon>
            <h3>简化版模板 (CSV)</h3>
          </div>
          
          <div class="template-description">
            <p>适合日常记账，包含基础字段</p>
            <p><strong>字段：</strong>日期、金额、类型、分类、描述、成员</p>
          </div>
          
          <el-button 
            type="primary" 
            @click="downloadTemplate('csv')"
            :loading="downloading === 'csv'"
          >
            <el-icon><Download /></el-icon>
            下载 CSV 模板
          </el-button>
        </div>

                 <div class="template-card">
           <div class="template-header">
             <el-icon size="24" color="#67C23A">
               <Tickets />
             </el-icon>
             <h3>完整版模板 (Excel)</h3>
           </div>
           
           <div class="template-description">
             <p>适合批量导入，功能丰富</p>
             <p><strong>字段：</strong>日期、金额、类型、分类、描述、成员</p>
           </div>
           
           <el-button 
             type="success" 
             @click="downloadTemplate('xlsx')"
             :loading="downloading === 'xlsx'"
           >
             <el-icon><Download /></el-icon>
             下载 Excel 模板
           </el-button>
         </div>
      </div>

      <div class="usage-tips">
        <el-alert 
          title="提示：下载模板文件，按格式填写数据后上传即可" 
          type="info" 
          :show-icon="true"
          :closable="false"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Tickets, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

// Props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 状态
const downloading = ref<'csv' | 'xlsx' | null>(null)

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 示例数据
const csvSampleData = [
  { date: '2024/1/15', amount: '-25.5', type: '支出', category: '餐饮', description: '午餐' },
  { date: '2024/1/14', amount: '5000', type: '收入', category: '工资', description: '月薪' }
]

// 方法
const downloadTemplate = async (type: 'csv' | 'xlsx') => {
  downloading.value = type
  
  try {
    if (type === 'csv') {
      // CSV模板内容
      const content = `日期,金额,类型,分类,描述,成员
2024/1/15,-25.5,支出,餐饮,午餐,
2024/1/14,-50,支出,交通,地铁卡充值,
2024/1/14,5000,收入,工资,月薪,
2024/1/13,-156.8,支出,购物,超市购物,张三
2024/1/12,-58,支出,娱乐,电影票,`
      
      const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = '简化版导入模板.csv'
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('简化版CSV模板下载成功')
    } else {
      // Excel模板数据
      const worksheetData = [
        ['日期', '金额', '类型', '分类', '描述', '备注', '标签', '成员'],
        ['2024/1/15', -25.5, '支出', '餐饮', '午餐', '工作日午餐', '餐饮', ''],
        ['2024/1/14', -50, '支出', '交通', '地铁卡充值', '月度交通卡', '交通', ''],
        ['2024/1/14', 5000, '收入', '工资', '月薪', '基本工资', '收入', ''],
        ['2024/1/13', -156.8, '支出', '购物', '超市购物', '日用品采购', '购物', '张三'],
        ['2024/1/12', -58, '支出', '娱乐', '电影票', '周末娱乐', '娱乐', ''],
        ['2024/1/11', -12.5, '支出', '餐饮', '早餐', '咖啡', '餐饮', ''],
        ['2024/1/10', -200, '支出', '运动', '健身卡', '月卡续费', '运动', '']
      ]
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // 设置列宽
      worksheet['!cols'] = [
        { width: 12 }, // 日期
        { width: 10 }, // 金额
        { width: 8 },  // 类型
        { width: 10 }, // 分类
        { width: 20 }, // 描述
        { width: 15 }, // 备注
        { width: 10 }, // 标签
        { width: 8 }   // 成员
      ]
      
      // 添加工作表
      XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录')
      
      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '完整版导入模板.xlsx'
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('完整版Excel模板下载成功')
    }
    
  } catch (error) {
    console.error('模板下载失败:', error)
    ElMessage.error('模板下载失败，请重试')
  } finally {
    downloading.value = null
  }
}

const handleClose = () => {
  downloading.value = null
}
</script>

<style scoped>
.template-download {
  padding: 0;
}

.template-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.template-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 1.25rem;
  background: #fafafa;
  text-align: center;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e4e7ed;
}

.template-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.template-description {
  margin-bottom: 1rem;
}

.template-description p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.template-sample {
  margin-bottom: 1.5rem;
}

.template-sample h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #374151;
}

.template-sample ul {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

.template-sample li {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.usage-tips {
  margin-top: 1rem;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .template-options {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style> 