import { apiClient } from './index'
import type { 
  AccountBook, 
  CreateAccountBookRequest, 
  UpdateAccountBookRequest,
  AccountBookList,
  AccountBookPermission,
  Category,
  Budget
} from '../types/api'

/**
 * 账本管理API类
 * 处理账本的创建、查询、更新、删除等操作
 */
export class AccountBookAPI {

  /**
   * 获取账本列表
   */
  async getAccountBooks(params?: {
    page?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<AccountBookList> {
    const response = await apiClient.get<AccountBookList>('/account-books', { params })
    return response.data
  }

  /**
   * 获取单个账本详情
   */
  async getAccountBook(id: string): Promise<AccountBook> {
    const response = await apiClient.get<AccountBook>(`/account-books/${id}`)
    return response.data
  }

  /**
   * 创建新账本
   */
  async createAccountBook(data: CreateAccountBookRequest): Promise<AccountBook> {
    const response = await apiClient.post<AccountBook>('/account-books', data)
    return response.data
  }

  /**
   * 更新账本信息
   */
  async updateAccountBook(id: string, data: UpdateAccountBookRequest): Promise<AccountBook> {
    const response = await apiClient.put<AccountBook>(`/account-books/${id}`, data)
    return response.data
  }

  /**
   * 删除账本
   */
  async deleteAccountBook(id: string): Promise<void> {
    await apiClient.delete(`/account-books/${id}`)
  }

  /**
   * 获取账本权限信息
   */
  async getAccountBookPermissions(id: string): Promise<AccountBookPermission[]> {
    const response = await apiClient.get<AccountBookPermission[]>(`/account-books/${id}/permissions`)
    return response.data
  }

  /**
   * 邀请用户到账本
   */
  async inviteUser(accountBookId: string, email: string, role: 'viewer' | 'editor' | 'admin'): Promise<void> {
    await apiClient.post(`/account-books/${accountBookId}/invite`, {
      email,
      role
    })
  }

  /**
   * 移除账本用户
   */
  async removeUser(accountBookId: string, userId: string): Promise<void> {
    await apiClient.delete(`/account-books/${accountBookId}/users/${userId}`)
  }

  /**
   * 更新用户权限
   */
  async updateUserRole(accountBookId: string, userId: string, role: 'viewer' | 'editor' | 'admin'): Promise<void> {
    await apiClient.patch(`/account-books/${accountBookId}/users/${userId}`, { role })
  }

  /**
   * 获取账本统计信息
   */
  async getAccountBookStats(id: string, period?: {
    startDate: string
    endDate: string
  }): Promise<{
    totalIncome: number
    totalExpense: number
    balance: number
    transactionCount: number
    categoryStats: Array<{
      categoryId: string
      categoryName: string
      amount: number
      count: number
    }>
  }> {
    const response = await apiClient.get(`/account-books/${id}/stats`, { params: period })
    return response.data
  }

  /**
   * 导出账本数据
   */
  async exportAccountBook(id: string, format: 'excel' | 'csv', params?: {
    startDate?: string
    endDate?: string
    categories?: string[]
  }): Promise<void> {
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)
    
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.categories) {
      params.categories.forEach(cat => queryParams.append('categories', cat))
    }

    await apiClient.download(
      `/account-books/${id}/export?${queryParams.toString()}`,
      `account-book-${id}-${format === 'excel' ? 'xlsx' : 'csv'}`
    )
  }

  /**
   * 复制账本
   */
  async copyAccountBook(id: string, newName: string): Promise<AccountBook> {
    const response = await apiClient.post<AccountBook>(`/account-books/${id}/copy`, {
      name: newName
    })
    return response.data
  }

  /**
   * 归档账本
   */
  async archiveAccountBook(id: string): Promise<void> {
    await apiClient.patch(`/account-books/${id}/archive`)
  }

  /**
   * 恢复账本
   */
  async restoreAccountBook(id: string): Promise<void> {
    await apiClient.patch(`/account-books/${id}/restore`)
  }

  /**
   * 获取账本分类列表
   */
  async getAccountBookCategories(accountBookId: string): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(`/account-books/${accountBookId}/categories`)
    return response.data
  }

  /**
   * 获取账本预算列表（仅获取有效的预算）
   */
  async getAccountBookBudgets(accountBookId: string): Promise<Budget[]> {
    const response = await apiClient.get<Budget[]>(`/account-books/${accountBookId}/budgets?status=active`)
    return response.data
  }
}

// 创建账本API实例
export const accountBookAPI = new AccountBookAPI() 