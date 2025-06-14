<template>
  <el-dialog
    v-model="visible"
    title="使用帮助"
    width="80%"
    max-width="800px"
    :before-close="handleClose"
  >
    <div class="help-content">
      <!-- 使用指南 -->
      <el-card class="help-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><InfoFilled /></el-icon>
            <span>使用指南</span>
          </div>
        </template>
        <div class="detailed-guide">
          <div class="guide-step">
            <div class="step-header">
              <el-icon color="#409EFF"><Setting /></el-icon>
              <h4>第一步：配置服务器</h4>
            </div>
            <div class="step-content">
              <p>在开始导入前，需要先配置记账服务器连接：</p>
              <ol>
                <li>在首页点击"开始导入"按钮</li>
                <li>在服务器配置页面输入服务器地址（如：https://your-server.com）</li>
                <li>输入您的用户名和密码</li>
                <li>点击"测试连接"按钮验证配置</li>
                <li>连接成功后点击"下一步"继续</li>
              </ol>
              <el-alert type="info" :closable="false" show-icon>
                <template #title>提示</template>
                服务器地址不需要包含 /api 路径，系统会自动添加
              </el-alert>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-header">
              <el-icon color="#67C23A"><Upload /></el-icon>
              <h4>第二步：上传文件</h4>
            </div>
            <div class="step-content">
              <p>上传您要导入的账单数据文件：</p>
              <ol>
                <li>点击"选择文件"按钮或直接拖拽文件到上传区域</li>
                <li>支持Excel (.xlsx, .xls) 和CSV (.csv) 格式</li>
                <li>文件大小建议小于10MB</li>
                <li>上传成功后系统会自动解析文件内容</li>
                <li>如果解析失败，请检查文件格式是否正确</li>
                <li>解析成功后点击"下一步"继续</li>
              </ol>
              <el-alert type="warning" :closable="false" show-icon>
                <template #title>注意</template>
                请确保文件包含必需的列：日期、金额、描述
              </el-alert>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-header">
              <el-icon color="#E6A23C"><Edit /></el-icon>
              <h4>第三步：调整分类映射</h4>
            </div>
            <div class="step-content">
              <p>配置文件中的分类与系统分类的对应关系：</p>
              <ol>
                <li>系统会显示文件中检测到的所有分类</li>
                <li>为每个分类选择对应的系统分类</li>
                <li>如果没有合适的系统分类，可以选择"其他"</li>
                <li>未映射的分类将使用默认分类</li>
                <li>预览数据确保解析结果正确</li>
                <li>确认无误后点击"下一步"继续</li>
              </ol>
              <el-alert type="success" :closable="false" show-icon>
                <template #title>建议</template>
                合理的分类映射有助于后续的数据分析和管理
              </el-alert>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-header">
              <el-icon color="#F56C6C"><DataLine /></el-icon>
              <h4>第四步：导入记录</h4>
            </div>
            <div class="step-content">
              <p>执行批量数据导入操作：</p>
              <ol>
                <li>确认导入设置和数据预览无误</li>
                <li>点击"开始导入"按钮启动导入过程</li>
                <li>系统会逐条处理每个记录</li>
                <li>可以实时查看导入进度和状态</li>
                <li>如遇到错误，系统会显示详细的错误信息</li>
                <li>导入完成后会自动跳转到报告页面</li>
              </ol>
              <el-alert type="info" :closable="false" show-icon>
                <template #title>提示</template>
                导入过程中请不要关闭浏览器或刷新页面
              </el-alert>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-header">
              <el-icon color="#909399"><Document /></el-icon>
              <h4>第五步：查看报告</h4>
            </div>
            <div class="step-content">
              <p>查看导入结果和统计信息：</p>
              <ol>
                <li>查看导入成功和失败的记录数量</li>
                <li>查看详细的导入统计信息</li>
                <li>如有失败记录，可查看具体的错误原因</li>
                <li>点击"查看账本数据"跳转到记账系统查看导入的数据</li>
                <li>如需要，可以下载详细的导入报告</li>
              </ol>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-header">
              <el-icon color="#F56C6C"><Delete /></el-icon>
              <h4>第六步：撤销导入（可选）</h4>
            </div>
            <div class="step-content">
              <p>如果需要撤销本次导入的数据：</p>
              <ol>
                <li>在导入报告页面点击"撤销导入"按钮</li>
                <li>系统会提示确认撤销操作</li>
                <li>确认后系统会逐条删除本次导入的记录</li>
                <li>可以实时查看撤销进度</li>
                <li>撤销完成后会显示操作结果</li>
              </ol>
              <el-alert type="error" :closable="false" show-icon>
                <template #title>警告</template>
                撤销操作不可逆，请谨慎操作。建议在导入前先备份重要数据
              </el-alert>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 文件格式说明 -->
      <el-card class="help-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Document /></el-icon>
            <span>支持的文件格式</span>
          </div>
        </template>
        <div class="format-info">
          <h4>Excel 文件 (.xlsx, .xls)</h4>
          <p>支持标准的Excel格式，请确保数据在第一个工作表中。</p>
          
          <h4>CSV 文件 (.csv)</h4>
          <p>支持逗号分隔的CSV格式，编码建议使用UTF-8。</p>
          
          <h4>必需的列</h4>
          <ul>
            <li><strong>日期</strong>：交易日期，支持多种日期格式</li>
            <li><strong>金额</strong>：交易金额，支持正负数</li>
            <li><strong>描述</strong>：交易描述或备注</li>
          </ul>
          
          <h4>可选的列</h4>
          <ul>
            <li><strong>分类</strong>：交易分类</li>
            <li><strong>账户</strong>：账户信息</li>
            <li><strong>标签</strong>：交易标签</li>
          </ul>
        </div>
      </el-card>

      <!-- 常见问题 -->
      <el-card class="help-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><QuestionFilled /></el-icon>
            <span>常见问题</span>
          </div>
        </template>
        <el-collapse>
          <el-collapse-item title="文件上传失败怎么办？" name="1">
            <p>请检查以下几点：</p>
            <ul>
              <li>文件格式是否为支持的Excel或CSV格式</li>
              <li>文件大小是否超过限制（建议小于10MB）</li>
              <li>文件是否损坏或被其他程序占用</li>
              <li>网络连接是否正常</li>
            </ul>
          </el-collapse-item>
          
          <el-collapse-item title="数据解析错误如何解决？" name="2">
            <p>数据解析失败可能的原因：</p>
            <ul>
              <li>文件编码问题：CSV文件建议使用UTF-8编码</li>
              <li>日期格式不识别：请使用标准日期格式（如：2024-01-01）</li>
              <li>金额格式错误：请确保金额为数字格式</li>
              <li>必需列缺失：请确保包含日期、金额、描述列</li>
            </ul>
          </el-collapse-item>
          
          <el-collapse-item title="如何设置分类映射？" name="3">
            <p>分类映射用于将文件中的分类转换为系统分类：</p>
            <ul>
              <li>系统会自动识别文件中的分类</li>
              <li>您可以为每个分类选择对应的系统分类</li>
              <li>未映射的分类将使用默认分类</li>
              <li>可以在导入后手动调整分类</li>
            </ul>
          </el-collapse-item>
          
          <el-collapse-item title="导入失败如何处理？" name="4">
            <p>如果导入过程中出现错误：</p>
            <ul>
              <li>检查服务器连接是否正常</li>
              <li>确认认证信息是否正确</li>
              <li>查看错误信息并根据提示处理</li>
              <li>可以尝试重新导入失败的记录</li>
            </ul>
          </el-collapse-item>
          
          <el-collapse-item title="如何撤销导入？" name="5">
            <p>如果需要撤销已导入的数据：</p>
            <ul>
              <li>在导入报告页面点击"撤销导入"按钮</li>
              <li>系统会逐条删除本次导入的记录</li>
              <li>撤销操作不可逆，请谨慎操作</li>
              <li>建议在导入前先备份重要数据</li>
            </ul>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <!-- 技术支持 -->
      <el-card class="help-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Service /></el-icon>
            <span>技术支持</span>
          </div>
        </template>
        <div class="support-info">
          <p><strong>系统要求：</strong></p>
          <ul>
            <li>现代浏览器（Chrome、Firefox、Safari、Edge）</li>
            <li>JavaScript 已启用</li>
            <li>网络连接正常</li>
          </ul>
          
          <p><strong>获取帮助：</strong></p>
          <ul>
            <li>查看在线文档和教程</li>
            <li>联系技术支持团队</li>
            <li>提交问题反馈</li>
          </ul>
          
          <div class="download-manual">
            <el-button type="primary" @click="downloadManual">
              <el-icon><Download /></el-icon>
              下载用户手册
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  InfoFilled, 
  Document, 
  QuestionFilled, 
  Service, 
  Download,
  Setting,
  Upload,
  Edit,
  DataLine,
  Delete
} from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
})

watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleClose = () => {
  visible.value = false
}

const downloadManual = () => {
  // 创建用户手册内容
  const manualContent = `
# 数据导入工具用户手册

## 1. 使用指南

### 1.1 配置服务器
- 在首页点击"开始导入"进入导入向导
- 输入记账服务器地址（如：https://your-server.com）
- 输入用户名和密码进行认证
- 点击"测试连接"确认配置正确

### 1.2 上传文件
- 支持Excel (.xlsx, .xls) 和CSV (.csv) 格式
- 文件大小建议小于10MB
- 可以拖拽文件或点击选择文件
- 上传后会自动解析文件内容

### 1.3 导入数据
- 预览解析后的数据
- 配置分类映射（可选）
- 点击"开始导入"执行导入操作
- 查看导入进度和结果

### 1.4 查看报告
- 查看导入成功和失败的记录数量
- 可以撤销本次导入的所有数据
- 点击"查看账本数据"跳转到记账系统

## 2. 文件格式要求

### 2.1 必需的列
- 日期：交易日期，支持多种格式
- 金额：交易金额，支持正负数
- 描述：交易描述或备注

### 2.2 可选的列
- 分类：交易分类
- 账户：账户信息
- 标签：交易标签

### 2.3 格式示例
日期,金额,描述,分类
2024-01-01,100.00,工资收入,收入
2024-01-02,-50.00,午餐费用,餐饮

## 3. 常见问题解决

### 3.1 文件上传问题
- 检查文件格式和大小
- 确认网络连接正常
- 尝试重新上传

### 3.2 数据解析问题
- 检查文件编码（建议UTF-8）
- 确认日期和金额格式正确
- 检查必需列是否存在

### 3.3 导入失败问题
- 检查服务器连接
- 确认认证信息正确
- 查看具体错误信息

## 4. 技术支持

如需帮助，请联系技术支持团队。

---
生成时间：${new Date().toLocaleString()}
`

  // 创建下载链接
  const blob = new Blob([manualContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '数据导入工具用户手册.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.help-content {
  max-height: 70vh;
  overflow-y: auto;
}

.help-section {
  margin-bottom: 20px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.format-info h4 {
  color: var(--el-color-primary);
  margin: 16px 0 8px 0;
}

.format-info h4:first-child {
  margin-top: 0;
}

.format-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

.format-info li {
  margin: 4px 0;
}

.support-info p {
  margin: 12px 0 8px 0;
  font-weight: 600;
}

.support-info ul {
  margin: 8px 0 16px 0;
  padding-left: 20px;
}

.support-info li {
  margin: 4px 0;
}

.download-manual {
  margin-top: 20px;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-steps--vertical .el-step__main) {
  padding-left: 10px;
}

:deep(.el-collapse-item__header) {
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 15px;
}

/* 详细指南样式 */
.detailed-guide {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.guide-step {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.step-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.step-content {
  padding: 20px;
}

.step-content p {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.6;
}

.step-content ol {
  margin: 12px 0;
  padding-left: 20px;
}

.step-content li {
  margin: 8px 0;
  color: #606266;
  line-height: 1.6;
}

.step-content .el-alert {
  margin-top: 16px;
}
</style>
