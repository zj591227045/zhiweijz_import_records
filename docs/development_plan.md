# 导入交易记录网页 - 开发任务规划

## 项目时间线

### 总体计划
- **项目周期**: 2-3周
- **开发人员**: 1-2人
- **技术栈**: Vue 3 + TypeScript + Element Plus

### 当前进度状态 🔄
```
✅ 第1周: 基础架构 + 核心功能开发 (95%完成)
🔄 第2周: 数据处理 + 界面优化 (35%完成)
⏳ 第3周: 测试 + 部署 + 文档 (待开始)
```

## 最新完成功能 🎉

### 2024年完成的功能
- ✅ **登录状态持久化** - 完整的localStorage管理，支持自动登录恢复
- ✅ **分类管理系统** - 分类获取、缓存、统计显示
- ✅ **API架构统一** - 从继承模式改为组合模式，解决路径重复问题
- ✅ **智能导航逻辑** - 根据登录状态自动跳转到正确的步骤
- ✅ **错误处理优化** - API错误统一处理和用户友好提示
- ✅ **账本选择持久化** - 选择的账本自动保存和恢复

### localStorage完整管理
```javascript
// 当前localStorage结构
{
  "auth_token": "Bearer token...",
  "api_base_url": "https://app.zhiweijz.cn:1443", 
  "login_state": {"user": {...}, "timestamp": 123},
  "server_config": {"baseURL": "...", "timeout": 15000},
  "selected_account_book": {"id": "...", "name": "..."},
  "available_categories": [{...}, {...}]
}
```

## 详细任务分解

### 阶段一: 项目初始化 ✅ (已完成)

#### 任务1.1: 项目脚手架搭建 ✅
**估时**: 4小时
**负责人**: 前端开发
**任务内容**:
- [x] 创建Vue 3 + Vite项目
- [x] 配置TypeScript环境
- [x] 集成Element Plus UI库
- [x] 配置路由和状态管理
- [x] 设置代码规范工具 (ESLint + Prettier)
- [x] 配置环境变量管理

**交付物**: ✅
- 可运行的项目骨架
- 完整的开发环境配置

#### 任务1.2: 类型定义 ✅
**估时**: 4小时
**负责人**: 前端开发
**任务内容**:
- [x] 定义API接口类型 (`types/api.ts`)
- [x] 定义存储数据类型 (`types/storage.ts`)
- [x] 定义导入相关类型 (`types/import.ts`)
- [x] 定义通用类型 (`types/common.ts`)

**交付物**: ✅
- 完整的TypeScript类型定义文件

#### 任务1.3: 工具函数开发 ✅ (已完成)
**估时**: 6小时
**负责人**: 前端开发
**任务内容**:
- [x] 存储管理器 (`utils/storage.ts`)
- [x] 加密工具 (已集成到storage.ts)
- [x] 常量定义 (`utils/constants.ts`)
- [ ] 数据验证器 (`utils/data-validator.ts`) - 待开发

**交付物**: ✅
- 核心工具函数库 (95%完成)

### 阶段二: API封装与状态管理 ✅ (已完成)

#### 任务2.1: API客户端封装 ✅
**估时**: 8小时
**负责人**: 前端开发
**任务内容**:
- [x] 基础API客户端 (`api/index.ts`)
- [x] 认证API (`api/auth.ts`)
- [x] 账本API (`api/account-book.ts`)
- [x] 分类API (`api/category.ts`)
- [x] 预算API (`api/budget.ts`)
- [x] 交易API (`api/transaction.ts`)

**技术亮点**:
- ✅ 统一的错误处理和日志记录
- ✅ 自动token管理和localStorage同步
- ✅ 组合模式避免API路径重复问题
- ✅ 完整的请求/响应拦截器

**交付物**: ✅
- 完整的API封装层

#### 任务2.2: 状态管理开发 ✅
**估时**: 10小时
**负责人**: 前端开发
**任务内容**:
- [x] 导入流程Store (`stores/import.ts`) - 包含所有状态管理
- [x] 登录状态持久化
- [x] 账本选择持久化
- [x] 分类数据缓存
- [x] 智能状态恢复

**技术亮点**:
```javascript
// 完整的状态管理实现
export const useImportStore = defineStore('import', {
  // 完整的导入流程状态
  // 持久化localStorage集成
  // 智能错误恢复
  // 分步骤数据管理
});
```

**交付物**: ✅
- 完整的状态管理系统

### 阶段三: 文件处理模块 ⏳ (待开发 - 下一阶段重点)

#### 任务3.1: 文件解析器 ⏳
**估时**: 10小时
**负责人**: 前端开发
**任务内容**:
- [ ] 基础解析器接口 (`utils/file-parser.ts`)
- [ ] Excel解析器实现
- [ ] CSV解析器实现
- [ ] 文件格式验证
- [ ] 数据格式标准化

**优先级**: 🔥 **高** - 下一个开发重点

#### 任务3.2: 智能分类匹配 ⏳
**估时**: 12小时
**负责人**: 前端开发
**任务内容**:
- [ ] 分类映射配置
- [ ] 智能匹配算法 (`utils/category-matcher.ts`)
- [ ] 模糊匹配实现
- [ ] 关键词匹配
- [ ] 用户自定义规则

**依赖**: 需要先完成文件解析器

### 阶段四: 核心组件开发 🔄 (进行中)

#### 任务4.1: 通用组件 ✅
**估时**: 8小时
**负责人**: 前端开发
**任务内容**:
- [x] 应用头部 (集成到ImportWizard中)
- [x] 加载组件 (Element Plus内置)
- [x] 错误提示 (Element Plus内置)
- [x] 步骤指示器 (自定义实现)

#### 任务4.2: 业务组件 🔄
**估时**: 16小时
**负责人**: 前端开发
**任务内容**:
- [x] 服务器配置 (`components/server-config/ServerConfigForm.vue`)
- [x] 登录表单 (集成到ServerConfigForm中)
- [x] 账本选择器 (集成到ServerConfigForm中)
- [ ] 文件上传器 (`components/file-upload/FileUploader.vue`) - 基础完成，需增强
- [ ] 分类映射器 (`components/category-mapping/CategoryMapper.vue`) - 待开发
- [ ] 数据预览表格 (`components/data-preview/DataTable.vue`) - 待开发

**进度**: 60%完成

### 阶段五: 页面开发 ✅ (基础完成)

#### 任务5.1: 主要页面开发 ✅
**估时**: 12小时
**负责人**: 前端开发
**任务内容**:
- [x] 首页 (`views/HomePage.vue`)
- [x] 导入向导 (`views/ImportWizard.vue`)
- [x] 导入报告 (`views/ImportReport.vue`)

#### 任务5.2: 页面逻辑实现 ✅
**估时**: 10小时
**负责人**: 前端开发
**任务内容**:
- [x] 步骤导航逻辑
- [x] 数据流管理
- [x] 错误处理
- [x] 进度显示
- [x] 登录状态管理
- [x] 持久化恢复

**交付物**: ✅
- 完整的页面应用框架

### 阶段六: 数据处理与导入 ⏳ (下一阶段重点)

#### 任务6.1: 数据验证与清洗 ⏳
**估时**: 8小时
**负责人**: 前端开发
**任务内容**:
- [ ] 数据格式验证
- [ ] 数据清洗规则
- [ ] 错误数据处理
- [ ] 数据预览生成

**优先级**: 🔥 **高**

#### 任务6.2: 批量导入实现 ⏳
**估时**: 8小时
**负责人**: 前端开发
**任务内容**:
- [ ] 分批处理逻辑
- [ ] 进度控制
- [ ] 错误恢复
- [ ] 结果统计

**优先级**: 🔥 **高**

## 当前优先级任务 🎯

### 下一步执行计划 (本次开发重点)
1. **🔥 文件解析器开发** - Excel/CSV文件解析，支持多种格式
2. **🔥 文件上传组件增强** - 完善上传、预览、验证功能
3. **🔥 数据预览与映射** - 数据表格显示和分类映射界面
4. **🔥 批量导入实现** - 实际的数据导入处理

### 当前技术债务
- [ ] 文件解析功能完全缺失
- [ ] 数据验证器 (`utils/data-validator.ts`) 
- [ ] 分类映射组件待开发
- [ ] 批量导入逻辑待实现

### 已解决的技术债务 ✅
- [x] API架构统一 (组合模式)
- [x] 登录状态持久化
- [x] 分类数据管理
- [x] 错误处理优化
- [x] localStorage完整管理

## 风险管控

### 技术风险
1. **文件解析兼容性**
   - 风险: 不同来源的Excel/CSV格式差异
   - 缓解: 提供标准模板，支持格式配置

2. **大文件处理性能**
   - 风险: 大文件导致浏览器卡顿
   - 缓解: 流式处理，分批上传

3. **跨域API调用**
   - 风险: 自定义服务器的CORS问题
   - 缓解: 提供CORS配置指南

### 业务风险
1. **数据准确性**
   - 风险: 分类匹配错误
   - 缓解: 提供预览确认，支持手动调整

2. **数据安全性**
   - 风险: 敏感数据泄露
   - 缓解: 本地加密存储，及时清理

## 质量保证

### 代码质量
- 代码覆盖率 > 80%
- ESLint无错误
- TypeScript严格模式
- 代码审查制度

### 用户体验
- 页面加载时间 < 3秒
- 操作响应时间 < 500ms
- 移动端适配良好
- 无障碍性支持

### 稳定性
- 错误边界处理
- 网络异常恢复
- 数据备份机制
- 优雅降级支持

## 交付清单

### 最终交付物
- [ ] 完整的前端应用源码
- [ ] 构建后的静态文件
- [ ] Docker部署镜像
- [ ] 用户使用手册
- [ ] 开发者文档
- [ ] 测试报告
- [ ] 性能分析报告

### 验收标准
- [ ] 所有功能模块正常工作
- [ ] 支持Excel和CSV文件导入
- [ ] 智能分类匹配准确率 > 85%
- [ ] 大文件(10MB)处理正常
- [ ] 移动端适配完善
- [ ] 测试覆盖率 > 80%
- [ ] 性能指标达标 

## 新会话开始AI提示词 🤖

### 项目背景提示词

```markdown
你好！我需要继续开发一个Vue 3 + TypeScript的记账数据导入项目。这是一个4步导入向导：服务配置、文件上传、数据导入、导入报告。

## 当前项目状态 ✅

### 已完成的核心功能
- ✅ **完整的登录状态持久化系统** - localStorage管理，自动登录恢复
- ✅ **统一的API架构** - 组合模式，避免路径重复问题  
- ✅ **分类管理系统** - 29个系统分类的获取、缓存、统计显示
- ✅ **智能导航逻辑** - 根据登录状态自动跳转到正确步骤
- ✅ **账本选择持久化** - 选择结果自动保存和恢复

### 技术栈和架构
- **前端**: Vue 3 + TypeScript + Vite + Element Plus + Pinia
- **API通信**: Axios客户端，自动token管理
- **状态管理**: 统一的import store (`src/stores/import.ts`)
- **服务器**: `https://app.zhiweijz.cn:1443`

### 当前localStorage结构
```javascript
{
  "auth_token": "Bearer token...",
  "api_base_url": "https://app.zhiweijz.cn:1443", 
  "login_state": {"user": {...}, "timestamp": 123},
  "server_config": {"baseURL": "...", "timeout": 15000},
  "selected_account_book": {"id": "...", "name": "..."},
  "available_categories": [{...}, {...}]  // 29个系统分类
}
```

### 项目结构
```
src/
├── api/                    # API封装层 ✅ 已完成
│   ├── index.ts           # 统一API客户端
│   ├── auth.ts            # 认证API
│   ├── account-book.ts    # 账本API  
│   ├── category.ts        # 分类API
│   └── transaction.ts     # 交易API
├── stores/
│   └── import.ts          # 统一状态管理 ✅ 已完成
├── components/
│   └── server-config/     # 服务配置组件 ✅ 已完成
├── views/
│   ├── ImportWizard.vue   # 主导入向导 ✅ 已完成
│   └── ...
└── types/api.ts           # 完整类型定义 ✅ 已完成
```

## 下一阶段开发目标 🎯

我需要开发**文件处理模块**，包括以下4个核心功能：

### 1. Excel/CSV文件解析器 🔥 最高优先级
- **位置**: `src/utils/file-parser.ts`
- **功能**: 解析Excel(.xlsx)和CSV文件，转换为标准格式
- **输出格式**: 
```typescript
interface ImportRecord {
  date: string;        // 日期
  description: string; // 描述
  amount: number;      // 金额
  category: string;    // 分类名称
  direction?: 'income' | 'expense'; // 收支方向
  tags?: string[];     // 标签
  notes?: string;      // 备注
}
```

### 2. 文件上传组件增强
- **位置**: `src/components/file-upload/FileUploader.vue`
- **功能**: 拖拽上传、格式验证、解析预览、错误处理

### 3. 数据预览表格
- **位置**: `src/components/data-preview/DataTable.vue` 
- **功能**: 显示解析后的数据，支持编辑、验证、分页

### 4. 分类映射界面
- **位置**: `src/components/category-mapping/CategoryMapper.vue`
- **功能**: 将CSV中的分类自动映射到29个系统分类

## 技术要求

### 文件解析技术点
- 使用`xlsx`库处理Excel文件
- 支持多种CSV编码格式  
- 智能列名识别（支持中英文）
- 数据类型自动转换
- 错误数据标记和处理

### 系统分类参考
已有29个系统分类，类型包括：
- **INCOME**: 工资、兼职、理财、奖金、提成、其他
- **EXPENSE**: 餐饮、购物、日用、交通、运动、娱乐、通讯、服饰、美容、居家、孩子、长辈、社交、旅行、数码、汽车、医疗、还款、保险、学习、办公、维修、利息

请从**Excel/CSV文件解析器**开始开发，需要支持常见的记账软件导出格式。
```

### 关键文件参考清单

在新会话中，请重点查看以下文件了解当前架构：

1. **状态管理**: `src/stores/import.ts` - 完整的导入流程状态
2. **API架构**: `src/api/index.ts` - 统一API客户端
3. **类型定义**: `src/types/api.ts` - 完整的TypeScript类型
4. **主界面**: `src/views/ImportWizard.vue` - 4步导入向导
5. **开发计划**: `docs/development_plan.md` - 最新的任务规划

### 开发环境设置

确保工作目录在：`/Users/jackson/Documents/Code/zhiweijz_import_records`

当前项目已可正常运行，登录功能完善，可以选择账本和查看分类。下一步需要实现文件解析功能。

---

使用以上提示词在新会话中开始，AI将能快速理解项目现状并继续开发工作。 