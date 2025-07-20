import { ApiClient } from './index'
import type { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionList,
  ImportTransactionRequest,
  ImportResult
} from '../types/api'

/**
 * 批量导入相关的类型定义
 */
export interface BatchImportOptions {
  batchSize?: number
  onProgress?: (progress: { completed: number; total: number; currentBatch: number }) => void
  onBatchComplete?: (result: { success: Transaction[]; failed: ImportError[] }) => void
  signal?: AbortSignal // 用于取消导入
}

export interface ImportError {
  index: number
  data: any
  error: string
}

export interface FileImportRequest {
  format: 'csv' | 'json'
  fileContent: string
}

export interface FileImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

export interface ImportSession {
  sessionId: string
  importedTransactionIds: string[]
  totalCount: number
  successCount: number
  failedCount: number
  createdAt: string
}

/**
 * 交易记录API类
 * 处理交易记录的创建、查询、更新、删除、批量导入等操作
 */
export class TransactionAPI extends ApiClient {

  /**
   * 获取交易记录列表
   */
  async getTransactions(params?: {
    accountBookId?: string
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
    categoryId?: string
    type?: 'income' | 'expense'
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<TransactionList> {
    const response = await this.get<TransactionList>('/transactions', { params })
    return response.data
  }

  /**
   * 获取单个交易记录
   */
  async getTransaction(id: string): Promise<Transaction> {
    const response = await this.get<Transaction>(`/transactions/${id}`)
    return response.data
  }

  /**
   * 创建交易记录
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await this.post<Transaction>('/transactions', data)
    
    console.log('[createTransaction] API 响应:', response)

    // 处理响应结构 - 服务器返回的是 {requestId, status, duration, data}
    if (response && response.data) {
      console.log('[createTransaction] 从 response.data 提取交易数据:', response.data)
      return response.data
    } else if (response && (response as any).id) {
      // 如果响应本身就是交易对象
      console.log('[createTransaction] 响应本身就是交易对象:', response)
      return response as unknown as Transaction
    } else {
      console.error('[createTransaction] 意外的响应结构:', response)
      throw new Error('无法解析创建交易的响应数据')
    }
  }

  /**
   * 批量创建交易记录
   */
  async createTransactionsBatch(transactions: CreateTransactionRequest[]): Promise<Transaction[]> {
    const response = await this.post<Transaction[]>('/transactions/batch', { transactions })
    return response.data
  }

  /**
   * 导入文件数据
   */
  async importFile(file: File): Promise<FileImportResult> {
    const response = await this.upload<FileImportResult>('/transactions/import', file)
    return response.data
  }

  /**
   * 导入交易数据
   */
  async importTransactions(data: ImportTransactionRequest): Promise<ImportResult> {
    const response = await this.post<ImportResult>('/transactions/import-data', data)
    return response.data
  }

  /**
   * 验证导入数据
   */
  async validateImportData(data: any[]): Promise<{
    validCount: number
    invalidCount: number
    errors: Array<{
      row: number
      field: string
      message: string
    }>
    warnings: Array<{
      row: number
      field: string
      message: string
    }>
  }> {
    const response = await this.post('/transactions/validate-import', { data })
    return response.data
  }

  /**
   * 更新交易记录
   */
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    const response = await this.put<Transaction>(`/transactions/${id}`, data)
    return response.data
  }

  /**
   * 删除交易记录
   */
  async deleteTransaction(accountBookId: string, transactionId: string): Promise<void> {
    await this.delete(`/account-books/${accountBookId}/transactions/${transactionId}`)
  }

  /**
   * 批量删除交易记录
   */
  async batchDeleteTransactions(accountBookId: string, transactionIds: string[]): Promise<void> {
    await this.post(`/account-books/${accountBookId}/transactions/batch-delete`, {
      transactionIds
    })
  }

  /**
   * 批量更新交易记录
   */
  async batchUpdateTransactions(accountBookId: string, updates: Array<{
    transactionId: string
    data: Partial<UpdateTransactionRequest>
  }>): Promise<Transaction[]> {
    const response = await this.patch<Transaction[]>(`/account-books/${accountBookId}/transactions/batch-update`, {
      updates
    })
    return response.data
  }

  /**
   * 方法一：使用文件导入API（推荐用于简单场景）
   */
  async importFromFile(data: FileImportRequest): Promise<FileImportResult> {
    const response = await this.post<FileImportResult>('/transactions/import', data)
    return response.data
  }

  /**
   * 方法二：批量创建交易记录（推荐用于需要撤销功能的场景）
   * 逐条创建，可以获取每条记录的ID，支持撤销功能
   */
  async batchCreateTransactions(
    accountBookId: string, 
    transactions: CreateTransactionRequest[], 
    options: BatchImportOptions = {}
  ): Promise<{
    importSession: ImportSession
    results: {
      success: Transaction[]
      failed: ImportError[]
    }
  }> {
    const { 
      batchSize = 10, 
      onProgress, 
      onBatchComplete,
      signal 
    } = options

    const results = {
      success: [] as Transaction[],
      failed: [] as ImportError[]
    }

    const importedTransactionIds: string[] = []
    const totalBatches = Math.ceil(transactions.length / batchSize)

    try {
      for (let i = 0; i < transactions.length; i += batchSize) {
        // 检查是否被取消
        if (signal?.aborted) {
          throw new Error('导入已取消')
        }

        const batch = transactions.slice(i, i + batchSize)
        const currentBatch = Math.floor(i / batchSize) + 1

        // 处理当前批次
        const batchResults = await this.processBatch(accountBookId, batch, i)
        
        // 收集成功的记录ID
        batchResults.success.forEach(transaction => {
          importedTransactionIds.push(transaction.id)
        })

        // 合并结果
        results.success.push(...batchResults.success)
        results.failed.push(...batchResults.failed)

        // 调用进度回调
        onProgress?.({
          completed: i + batch.length,
          total: transactions.length,
          currentBatch
        })

        // 调用批次完成回调
        onBatchComplete?.(batchResults)

        // 避免过于频繁的请求
        if (currentBatch < totalBatches) {
          await this.delay(100) // 100ms延迟
        }
      }

      // 创建导入会话记录
      const importSession: ImportSession = {
        sessionId: this.generateSessionId(),
        importedTransactionIds,
        totalCount: transactions.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        createdAt: new Date().toISOString()
      }

      // 保存导入会话到本地存储（用于撤销功能）
      this.saveImportSession(importSession)

      return {
        importSession,
        results
      }

    } catch (error) {
      // 如果导入过程中出错，清理已导入的记录
      if (importedTransactionIds.length > 0) {
        console.warn('导入过程中出错，正在清理已导入的记录...')
        try {
          await this.batchDeleteTransactions(accountBookId, importedTransactionIds)
        } catch (cleanupError) {
          console.error('清理已导入记录失败:', cleanupError)
        }
      }
      throw error
    }
  }

  /**
   * 处理单个批次的导入
   */
  private async processBatch(
    accountBookId: string, 
    batch: CreateTransactionRequest[], 
    startIndex: number
  ): Promise<{
    success: Transaction[]
    failed: ImportError[]
  }> {
    const success: Transaction[] = []
    const failed: ImportError[] = []

    console.log(`[processBatch] 开始处理批次，交易数量: ${batch.length}`)

    // 并发处理批次中的记录
    const promises = batch.map(async (transaction, index) => {
      try {
        const created = await this.createTransaction(transaction)
        console.log(`[processBatch] 交易 ${startIndex + index} 创建成功:`, created)
        return { success: created, failed: null, index: startIndex + index }
      } catch (error) {
        console.error(`[processBatch] 交易 ${startIndex + index} 创建失败:`, error)
        return { 
          success: null, 
          failed: {
            index: startIndex + index,
            data: transaction,
            error: error instanceof Error ? error.message : '未知错误'
          },
          index: startIndex + index
        }
      }
    })

    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          success.push(result.value.success)
          console.log(`[processBatch] 记录 ${startIndex + index} 添加到成功列表`)
        }
        if (result.value.failed) {
          failed.push(result.value.failed)
          console.log(`[processBatch] 记录 ${startIndex + index} 添加到失败列表`)
        }
      } else {
        failed.push({
          index: startIndex + index,
          data: null,
          error: result.reason?.message || '批次处理失败'
        })
        console.error(`[processBatch] Promise rejected for record ${startIndex + index}:`, result.reason)
      }
    })

    console.log(`[processBatch] 批次处理完成 - 成功: ${success.length}, 失败: ${failed.length}`)
    return { success, failed }
  }

  /**
   * 撤销导入
   */
  async undoImport(sessionId: string, accountBookId: string): Promise<{
    deletedCount: number
    errors: string[]
  }> {
    console.log('[UNDO] 开始撤销导入，sessionId:', sessionId)
    
    // 获取所有会话进行调试
    const allSessions = this.getImportSessions()
    console.log('[UNDO] 所有可用会话:', allSessions)
    console.log('[UNDO] 查找的会话ID:', sessionId)
    
    const session = this.getImportSession(sessionId)
    console.log('[UNDO] 找到的会话:', session)
    
    if (!session) {
      console.error('[UNDO] 导入会话不存在，可用的会话ID列表:', allSessions.map(s => s.sessionId))
      throw new Error('导入会话不存在')
    }

    const errors: string[] = []
    let deletedCount = 0

    // 逐个删除交易记录，使用DELETE API
    for (const transactionId of session.importedTransactionIds) {
      try {
        // 调用DELETE API删除单个交易记录（直接访问/transactions路径）
        await this.delete(`/transactions/${transactionId}`)
        deletedCount++
        console.log(`成功删除交易记录: ${transactionId}`)
      } catch (deleteError) {
        const errorMessage = `删除记录 ${transactionId} 失败: ${deleteError instanceof Error ? deleteError.message : '未知错误'}`
        errors.push(errorMessage)
        console.error(errorMessage, deleteError)
      }
    }

    // 删除成功后，清理导入会话记录
    if (deletedCount > 0) {
      if (deletedCount === session.importedTransactionIds.length) {
        // 全部删除成功，移除会话记录
        this.removeImportSession(sessionId)
        console.log(`撤销导入完成，删除了 ${deletedCount} 条记录`)
      } else {
        // 部分删除成功，更新会话记录中剩余的ID
        const remainingIds = session.importedTransactionIds.slice(deletedCount)
        this.saveImportSession({
          ...session,
          importedTransactionIds: remainingIds
        })
        console.log(`部分撤销完成，删除了 ${deletedCount} 条记录，还有 ${remainingIds.length} 条记录未删除`)
      }
    }

    return { deletedCount, errors }
  }

  /**
   * 获取导入会话列表
   */
  getImportSessions(): ImportSession[] {
    const sessions = localStorage.getItem('import_sessions')
    return sessions ? JSON.parse(sessions) : []
  }

  /**
   * 获取特定导入会话
   */
  getImportSession(sessionId: string): ImportSession | null {
    const sessions = this.getImportSessions()
    return sessions.find(s => s.sessionId === sessionId) || null
  }

  /**
   * 保存导入会话
   */
  private saveImportSession(session: ImportSession): void {
    const sessions = this.getImportSessions()
    const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId)
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    // 只保留最近的10个会话
    const recentSessions = sessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    localStorage.setItem('import_sessions', JSON.stringify(recentSessions))
  }

  /**
   * 删除导入会话
   */
  private removeImportSession(sessionId: string): void {
    const sessions = this.getImportSessions()
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId)
    localStorage.setItem('import_sessions', JSON.stringify(filteredSessions))
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 批量导入交易记录（旧方法，保持兼容性）
   */
  async batchImportTransactions(accountBookId: string, transactions: ImportTransactionRequest[]): Promise<ImportResult> {
    const response = await this.post<ImportResult>(`/account-books/${accountBookId}/transactions/batch-import`, {
      transactions
    })
    return response.data
  }

  /**
   * 获取交易统计
   */
  async getTransactionStats(params?: {
    accountBookId?: string
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month' | 'year'
    categoryId?: string
  }): Promise<{
    totalIncome: number
    totalExpense: number
    balance: number
    transactionCount: number
    stats: Array<{
      label: string
      income: number
      expense: number
      balance: number
      count: number
    }>
  }> {
    const response = await this.get('/transactions/stats', { params })
    return response.data
  }

  /**
   * 获取最近交易
   */
  async getRecentTransactions(params?: {
    accountBookId?: string
    limit?: number
    categoryId?: string
  }): Promise<Transaction[]> {
    const response = await this.get<Transaction[]>('/transactions/recent', { params })
    return response.data
  }

  /**
   * 获取相似交易
   */
  async getSimilarTransactions(id: string, params?: {
    limit?: number
    threshold?: number
  }): Promise<Transaction[]> {
    const response = await this.get<Transaction[]>(`/transactions/${id}/similar`, { params })
    return response.data
  }

  /**
   * 查找重复交易
   */
  async findDuplicateTransactions(params?: {
    accountBookId?: string
    threshold?: number
    startDate?: string
    endDate?: string
  }): Promise<Array<{
    group: Transaction[]
    similarity: number
  }>> {
    const response = await this.get('/transactions/duplicates', { params })
    return response.data
  }

  /**
   * 合并重复交易
   */
  async mergeDuplicateTransactions(keepId: string, mergeIds: string[]): Promise<Transaction> {
    const response = await this.post<Transaction>('/transactions/merge', {
      keepId,
      mergeIds
    })
    return response.data
  }

  /**
   * 获取交易趋势分析
   */
  async getTransactionTrends(params?: {
    accountBookId?: string
    startDate?: string
    endDate?: string
    categoryId?: string
    period?: 'week' | 'month' | 'quarter' | 'year'
  }): Promise<{
    monthlyTrends: Array<{
      month: string
      amount: number
      growth: number
    }>
    categoryAnalysis: Array<{
      categoryId: string
      categoryName: string
      percentage: number
      trend: 'up' | 'down' | 'stable'
    }>
    insights: string[]
  }> {
    const response = await this.get('/transactions/trends', { params })
    return response.data
  }

  /**
   * 获取预算执行情况
   */
  async getBudgetExecution(params?: {
    accountBookId?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    categories: Array<{
      categoryId: string
      categoryName: string
      budgeted: number
      actual: number
      percentage: number
      status: 'under' | 'over' | 'on-track'
    }>
    totalBudgeted: number
    totalActual: number
    overallStatus: 'under' | 'over' | 'on-track'
  }> {
    const response = await this.get('/transactions/budget-execution', { params })
    return response.data
  }
}

// 创建交易API实例
export const transactionAPI = new TransactionAPI() 