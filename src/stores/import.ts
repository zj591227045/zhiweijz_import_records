import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../api/index'
import { authAPI } from '../api/auth'
import { accountBookAPI } from '../api/account-book'
import { categoryAPI } from '../api/category'
import { transactionAPI } from '../api/transaction'
import type { 
  AccountBook, 
  Category,
  CreateTransactionRequest
} from '../types/api'
import type {
  ServerConfig,
  ParseResult, 
  CategoryMapping, 
  ImportProgress
} from '../types/import'
import { parseFile } from '../utils/file-parser'
import { categoryAPI as oldCategoryAPI } from '../api/category'

export const useImportStore = defineStore('import', () => {
  // 状态
  const currentStep = ref(1)
  const totalSteps = ref(4) // 修改为4步
  
  // 第一步：服务配置
  const serverConfig = ref<{
    baseURL: string
    timeout?: number
  } | null>(null)
  const authToken = ref<string>('')
  const currentUser = ref<any>(null)
  const selectedAccountBook = ref<any>(null)
  const availableAccountBooks = ref<any[]>([])
  
  // 第二步：文件处理
  const uploadedFile = ref<File | null>(null)
  const parseResult = ref<ParseResult | null>(null)
  const categoryMapping = ref<CategoryMapping | null>(null)
  const availableCategories = ref<any[]>([])
  const availableBudgets = ref<any[]>([]) // 新增：可用预算列表
  
  // 第三步：数据导入
  const importProgress = ref<ImportProgress | null>(null)
  const importSessionId = ref<string>('')
  
  // 通用状态
  const isLoading = ref(false)
  const error = ref<string>('')
  const abortController = ref<AbortController | null>(null)

  // 计算属性
  const progressPercentage = computed(() => {
    return Math.round((currentStep.value / totalSteps.value) * 100)
  })

  const categoryStats = computed(() => {
    const categories = availableCategories.value
    return {
      total: categories.length,
      income: categories.filter(c => c.type === 'INCOME').length,
      expense: categories.filter(c => c.type === 'EXPENSE').length
    }
  })

  const canGoNext = computed(() => {
    switch (currentStep.value) {
      case 1: // 服务配置（包含服务器配置、登录、选择账本）
        return serverConfig.value?.baseURL && 
               authToken.value && 
               currentUser.value &&
               selectedAccountBook.value?.id
      case 2: // 文件处理（包含上传、分类映射、数据预览）
        return uploadedFile.value && 
               parseResult.value?.success && 
               categoryMapping.value &&
               parseResult.value?.data?.length > 0
      case 3: // 数据导入
        return importProgress.value?.status === 'completed'
      default:
        return true
    }
  })

  const canGoPrev = computed(() => {
    return currentStep.value > 1
  })

  const importData = computed(() => {
    console.log('Store - importData 计算开始:', {
      hasParseResult: !!parseResult.value,
      parseResultData: parseResult.value?.data?.length,
      hasCategoryMapping: !!categoryMapping.value,
      categoryMappingKeys: categoryMapping.value ? Object.keys(categoryMapping.value.mappings).length : 0
    })
    
    if (!parseResult.value?.data || !categoryMapping.value) {
      console.log('Store - importData 返回空数组，原因:', {
        noParseResult: !parseResult.value?.data,
        noCategoryMapping: !categoryMapping.value
      })
      return []
    }
    
    const mappedData = parseResult.value.data.map(record => ({
      ...record,
      mappedCategory: categoryMapping.value?.mappings[record.category] || record.category
    }))
    
    console.log('Store - importData 返回映射数据:', {
      originalCount: parseResult.value.data.length,
      mappedCount: mappedData.length,
      sampleMapped: mappedData[0]
    })
    
    return mappedData
  })

  // 步骤名称和描述
  const stepInfo = computed(() => {
    const steps = [
      {
        title: '服务配置',
        description: '配置服务器、登录账户',
        subSteps: ['配置API服务器', '验证用户身份', '选择目标账本']
      },
      {
        title: '上传文件',
        description: '上传文件、配置映射',
        subSteps: ['上传Excel/CSV文件', '配置分类映射', '预览导入数据']
      },
      {
        title: '数据导入',
        description: '执行导入、监控进度',
        subSteps: ['批量导入数据', '监控导入进度', '处理导入错误']
      },
      {
        title: '导入报告',
        description: '查看结果、导出报告',
        subSteps: ['查看导入统计', '分析错误详情', '导出报告文件']
      }
    ]
    return steps
  })

  // 操作方法
  const nextStep = () => {
    if (currentStep.value < totalSteps.value && canGoNext.value) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps.value) {
      currentStep.value = step
    }
  }

  // 第一步：服务配置相关方法
  const setServerConfig = async (config: { baseURL: string; timeout?: number }) => {
    try {
      error.value = ''
      
      // 设置API客户端基础URL
      apiClient.setBaseURL(config.baseURL)
      serverConfig.value = config
      
      // 测试连接
      const isHealthy = await apiClient.healthCheck()
      if (!isHealthy) {
        throw new Error('无法连接到服务器，请检查配置')
      }
      
      // 保存服务器配置到localStorage
      localStorage.setItem('server_config', JSON.stringify(config))
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '服务器连接失败'
      throw err
    }
  }

  const login = async (credentials: { email: string; password: string }) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await authAPI.login(credentials)
      
      // 根据实际响应结构，直接访问token和user
      authToken.value = response.token
      currentUser.value = response.user
      
      // 设置API客户端的认证token（这会自动保存到localStorage）
      apiClient.setAuthToken(response.token)
      
      // 只保存用户信息和时间戳，token由API客户端管理
      const loginState = {
        user: response.user,
        timestamp: Date.now()
      }
      localStorage.setItem('login_state', JSON.stringify(loginState))
      
      // 获取账本列表
      await loadAccountBooks()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 恢复登录状态
  const restoreLoginState = async () => {
    try {
      // 恢复服务器配置
      const savedServerConfig = localStorage.getItem('server_config')
      if (savedServerConfig) {
        const config = JSON.parse(savedServerConfig)
        serverConfig.value = config
        apiClient.setBaseURL(config.baseURL)
      }
      
      // 恢复登录状态
      const savedLoginState = localStorage.getItem('login_state')
      const savedToken = localStorage.getItem('auth_token') // API客户端保存的token
      
      if (!savedLoginState || !savedToken) {
        return false
      }
      
      const loginState = JSON.parse(savedLoginState)
      
      // 检查token是否过期（假设token有效期为7天）
      const tokenAge = Date.now() - loginState.timestamp
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天
      
      if (tokenAge > maxAge) {
        // Token过期，清理状态
        clearLoginState()
        return false
      }
      
      // 恢复状态
      authToken.value = savedToken
      currentUser.value = loginState.user
      apiClient.setAuthToken(savedToken) // 确保API客户端也有token
      
      // 验证token是否仍然有效
      const isValid = await authAPI.validateToken()
      if (!isValid) {
        clearLoginState()
        return false
      }
      
      // 加载账本列表
      await loadAccountBooks()
      
      // 恢复分类数据
      const savedCategories = localStorage.getItem('available_categories')
      if (savedCategories) {
        try {
          availableCategories.value = JSON.parse(savedCategories)
        } catch (err) {
          console.warn('恢复分类数据失败:', err)
          // 如果恢复失败，重新加载
          await loadCategories()
        }
      } else {
        // 如果没有保存的分类，重新加载
        await loadCategories()
      }
      
      // 恢复选择的账本
      const savedAccountBook = localStorage.getItem('selected_account_book')
      if (savedAccountBook) {
        try {
          const accountBook = JSON.parse(savedAccountBook)
          selectedAccountBook.value = accountBook
        } catch (err) {
          console.warn('恢复选择的账本失败:', err)
          // 如果恢复失败，不影响整体流程
        }
      }
      
      // 直接跳转到账本选择步骤
      currentStep.value = 1 // 服务配置步骤，但会自动进入第三子步（账本选择）
      
      return true
    } catch (err) {
      console.warn('恢复登录状态失败:', err)
      clearLoginState()
      return false
    }
  }

  // 清理登录状态
  const clearLoginState = () => {
    localStorage.removeItem('login_state')
    localStorage.removeItem('server_config')
    localStorage.removeItem('selected_account_book')
    localStorage.removeItem('available_categories')
    // 不删除API客户端的token，让API客户端自己管理
    authToken.value = ''
    currentUser.value = null
    selectedAccountBook.value = null
    availableAccountBooks.value = []
    availableCategories.value = []
    apiClient.removeAuthToken() // 这会清理API客户端的localStorage
  }

  // 登出
  const logout = async () => {
    try {
      // 调用服务器登出API
      await authAPI.logout()
    } catch (err) {
      console.warn('服务器登出失败:', err)
    } finally {
      // 无论服务器登出是否成功，都清理本地状态
      clearLoginState()
      reset()
    }
  }

  const loadAccountBooks = async () => {
    try {
      const response = await accountBookAPI.getAccountBooks()
      
      // 账本数据在response.data数组中
      availableAccountBooks.value = response.data || []
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取账本列表失败'
      throw err
    }
  }

  const selectAccountBook = async (accountBook: any) => {
    try {
      selectedAccountBook.value = accountBook
      
      // 保存选择的账本到localStorage
      localStorage.setItem('selected_account_book', JSON.stringify(accountBook))
      
      // 并行加载分类和预算列表
      await Promise.all([
        loadCategories(),
        loadBudgets(accountBook.id)
      ])
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '选择账本失败'
      throw err
    }
  }

  const loadBudgets = async (accountBookId: string) => {
    try {
      const budgets = await accountBookAPI.getAccountBookBudgets(accountBookId)
      availableBudgets.value = budgets || []
      
      // 保存预算到localStorage
      localStorage.setItem('available_budgets', JSON.stringify(budgets || []))
      
    } catch (err) {
      console.warn('加载预算列表失败:', err)
      availableBudgets.value = []
    }
  }

  const loadCategories = async () => {
    try {
      const { categoryAPI } = await import('../api/category')
      const response = await categoryAPI.getCategories()
      // 直接使用响应数据，它已经是Category[]数组
      availableCategories.value = response || []
      
      // 保存分类到localStorage，避免重复请求
      localStorage.setItem('available_categories', JSON.stringify(response || []))
      
    } catch (err) {
      console.warn('加载分类列表失败:', err)
      availableCategories.value = []
    }
  }

  // 第二步：文件处理相关方法
  const setUploadedFile = async (file: File) => {
    try {
      isLoading.value = true
      error.value = ''
      uploadedFile.value = file
      
      // 解析文件
      const result = await parseFile(file)
      parseResult.value = result
      
      if (!result.success) {
        error.value = result.errors[0]?.message || '文件解析失败'
      } else {
        // 自动生成初始分类映射
        await generateInitialCategoryMapping()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '文件解析失败'
      parseResult.value = null
    } finally {
      isLoading.value = false
    }
  }

  const generateInitialCategoryMapping = async () => {
    if (!parseResult.value?.data || !availableCategories.value.length) {
      return
    }

    const { createCategoryMatcher } = await import('../utils/category-matcher')
    const matcher = createCategoryMatcher(availableCategories.value)

    const mappings: Record<string, string> = {}
    const uniqueCategories = [...new Set(parseResult.value.data.map(r => r.category).filter(Boolean))]
    
    // 智能分类映射：根据分类名称分析收支类型并进行匹配
    uniqueCategories.forEach(originalCategory => {
      // 先判断该分类应该是收入还是支出
      const type = inferCategoryType(originalCategory)
      
      // 使用智能匹配器匹配最合适的分类
      const bestMatch = matcher.getBestMatch(originalCategory, type)
      
      if (bestMatch && bestMatch.confidence > 0.3) {
        mappings[originalCategory] = bestMatch.categoryId
      } else {
        // 如果智能匹配失败，尝试简单的名称匹配
        const matchedCategory = availableCategories.value.find(cat => 
          cat.type === (type === 'income' ? 'INCOME' : 'EXPENSE') &&
          (cat.name.includes(originalCategory) || originalCategory.includes(cat.name))
        )
        
        if (matchedCategory) {
          mappings[originalCategory] = matchedCategory.id
        } else {
          mappings[originalCategory] = '' // 需要手动映射
        }
      }
    })

    categoryMapping.value = {
      mappings,
      unmappedCategories: uniqueCategories.filter(cat => !mappings[cat])
    }
  }

  // 推断分类类型（收入 vs 支出）
  const inferCategoryType = (categoryName: string): 'income' | 'expense' => {
    const incomeKeywords = [
      '工资', '薪水', '奖金', '津贴', '补助', '分红', '股息', '利息', '收益',
      '投资', '理财', '兼职', '外快', '收入', '进账', '报销', '退款', '返现',
      '红包', '礼金', '奖励', '佣金', '提成', '营收', '销售'
    ]
    
    const expenseKeywords = [
      '餐饮', '用餐', '早餐', '午餐', '晚餐', '夜宵', '零食', '饮料', '咖啡',
      '交通', '打车', '地铁', '公交', '油费', '停车', '过路费', '机票', '火车',
      '购物', '超市', '商场', '网购', '淘宝', '京东', '服装', '化妆品', '日用品',
      '娱乐', '电影', '游戏', '旅游', '景点', 'KTV', '酒吧', '运动', '健身',
      '医疗', '看病', '药费', '体检', '美容', '理发', '按摩',
      '教育', '学费', '培训', '考试', '书籍', '文具',
      '居住', '房租', '水费', '电费', '燃气费', '物业费', '维修', '装修',
      '通讯', '话费', '网费', '流量', '充值',
      '支出', '花费', '消费', '付款', '缴费', '开支'
    ]
    
    const categoryLower = categoryName.toLowerCase()
    
    // 检查是否包含收入关键词
    for (const keyword of incomeKeywords) {
      if (categoryLower.includes(keyword)) {
        return 'income'
      }
    }
    
    // 检查是否包含支出关键词
    for (const keyword of expenseKeywords) {
      if (categoryLower.includes(keyword)) {
        return 'expense'
      }
    }
    
    // 默认认为是支出（大部分记录是支出）
    return 'expense'
  }

  const setCategoryMapping = (mapping: CategoryMapping) => {
    categoryMapping.value = mapping
  }

  // 第三步：数据导入相关方法
  const executeImport = async () => {
    if (!selectedAccountBook.value?.id || !importData.value.length) {
      throw new Error('缺少必要的导入数据')
    }

    try {
      isLoading.value = true
      
      // 在开始新的导入前，清空旧的会话ID和记录
      importSessionId.value = ''
      
      // 执行导入前检查认证状态
      console.log('[IMPORT] Checking auth state before import...')
      apiClient.debugAuthState()
      
      // 如果没有认证令牌，尝试从localStorage恢复
      const hasToken = localStorage.getItem('auth_token')
      if (!hasToken) {
        throw new Error('认证令牌丢失，请重新登录')
      }
      
      // 强制恢复认证状态
      apiClient.forceRestoreAuth()
      console.log('[IMPORT] Auth state after restore:')
      apiClient.debugAuthState()
      
      // 设置批量操作标记
      apiClient.setBatchOperation(true)
      
      console.log('开始导入流程:', {
        accountBookId: selectedAccountBook.value.id,
        dataCount: importData.value.length,
        sampleData: importData.value[0]
      })
      
      // 创建中断控制器
      abortController.value = new AbortController()
      
      // 初始化进度
      importProgress.value = {
        status: 'importing',
        total: importData.value.length,
        completed: 0,
        failed: 0,
        errors: []
      }

      // 准备导入请求数据
      const transactions = importData.value.map((record, index) => {
        // 确保日期是Date对象
        const dateValue = record.date instanceof Date ? record.date : new Date(record.date)
        
        const transaction: CreateTransactionRequest = {
          amount: record.amount,
          type: record.direction === 'income' ? 'INCOME' : 'EXPENSE',
          categoryId: record.mappedCategory,
          description: record.description,
          date: dateValue,
          accountBookId: selectedAccountBook.value.id
          // familyId, familyMemberId, budgetId 根据需要添加
        }
        
        console.log(`准备记录 ${index + 1}:`, transaction)
        return transaction
      })

      console.log('开始批量创建交易记录...')

      // 使用新的批量创建API
      const result = await transactionAPI.batchCreateTransactions(
        selectedAccountBook.value.id,
        transactions,
        {
          batchSize: 10, // 每批处理10条记录
          onProgress: (progress) => {
            console.log('进度更新:', progress)
            // 实时更新进度
            if (importProgress.value) {
              importProgress.value.completed = Math.min(progress.completed, importProgress.value.total)
            }
          },
          onBatchComplete: (batchResult) => {
            console.log('批次完成:', batchResult)
            // 批次完成回调
            if (importProgress.value) {
              importProgress.value.failed += batchResult.failed.length
              importProgress.value.errors.push(...batchResult.failed.map(f => f.error))
            }
          },
          signal: abortController.value.signal
        }
      )

      console.log('导入完成:', result)

      // 保存会话ID用于撤销功能
      importSessionId.value = result.importSession.sessionId
      console.log('[IMPORT] 新的导入会话ID已保存:', importSessionId.value)

      // 更新最终进度
      importProgress.value = {
        status: 'completed',
        total: importData.value.length,
        completed: result.results.success.length,
        failed: result.results.failed.length,
        errors: result.results.failed.map(f => f.error)
      }

      return {
        successCount: result.results.success.length,
        failureCount: result.results.failed.length,
        errors: result.results.failed,
        sessionId: result.importSession.sessionId
      }
    } catch (err) {
      console.error('导入过程中发生错误:', err)
      
      // 更新进度状态为失败
      if (importProgress.value) {
        importProgress.value.status = 'failed'
        importProgress.value.errors.push(err instanceof Error ? err.message : '未知错误')
      }
      
      throw err
    } finally {
      // 清除批量操作标记
      apiClient.setBatchOperation(false)
      
      isLoading.value = false
      abortController.value = null
    }
  }

  // 取消导入
  const cancelImport = () => {
    if (abortController.value) {
      abortController.value.abort()
    }
  }

  // 撤销导入
  const undoImport = async (sessionId?: string) => {
    const targetSessionId = sessionId || importSessionId.value
    if (!targetSessionId || !selectedAccountBook.value?.id) {
      throw new Error('无法撤销导入：缺少会话ID或账本信息')
    }

    try {
      isLoading.value = true
      
      // 设置撤销状态
      if (importProgress.value) {
        importProgress.value.status = 'undoing'
      }
      
      const result = await transactionAPI.undoImport(targetSessionId, selectedAccountBook.value.id)
      
      // 撤销成功后，重置导入进度状态
      if (targetSessionId === importSessionId.value) {
        importSessionId.value = ''
        importProgress.value = null
      } else if (importProgress.value) {
        // 如果不是当前会话，恢复到完成状态
        importProgress.value.status = 'completed'
      }

      return result
    } catch (error) {
      // 撤销失败时，恢复到完成状态
      if (importProgress.value) {
        importProgress.value.status = 'completed'
      }
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取导入会话列表
  const getImportSessions = () => {
    return transactionAPI.getImportSessions()
  }

  // 重置方法
  const reset = () => {
    currentStep.value = 1
    serverConfig.value = null
    authToken.value = ''
    currentUser.value = null
    selectedAccountBook.value = null
    availableAccountBooks.value = []
    uploadedFile.value = null
    parseResult.value = null
    categoryMapping.value = null
    availableCategories.value = []
    importProgress.value = null
    isLoading.value = false
    error.value = ''
    
    // 清除API认证信息
    apiClient.removeAuthToken()
  }

  const resetFromStep = (step: number) => {
    if (step <= currentStep.value) {
      switch (step) {
        case 1:
          reset()
          break
        case 2:
          uploadedFile.value = null
          parseResult.value = null
          categoryMapping.value = null
          importProgress.value = null
          break
        case 3:
          importProgress.value = null
          break
      }
      currentStep.value = step
    }
  }

  return {
    // 状态
    currentStep,
    totalSteps,
    
    // 第一步：服务配置
    serverConfig,
    authToken,
    currentUser,
    selectedAccountBook,
    availableAccountBooks,
    
    // 第二步：文件处理
    uploadedFile,
    parseResult,
    categoryMapping,
    availableCategories,
    availableBudgets,
    
    // 第三步：数据导入
    importProgress,
    importSessionId,
    
    // 通用状态
    isLoading,
    error,
    abortController,
    
    // 计算属性
    progressPercentage,
    categoryStats,
    canGoNext,
    canGoPrev,
    importData,
    stepInfo,
    
    // 方法
    nextStep,
    prevStep,
    goToStep,
    
    // 第一步方法
    setServerConfig,
    login,
    loadAccountBooks,
    selectAccountBook,
    
    // 第二步方法
    setUploadedFile,
    generateInitialCategoryMapping,
    setCategoryMapping,
    
    // 第三步方法
    executeImport,
    cancelImport,
    undoImport,
    getImportSessions,
    
    // 重置方法
    reset,
    resetFromStep,
    
    // 登录相关方法
    restoreLoginState,
    clearLoginState,
    logout
  }
}) 
