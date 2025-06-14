import { apiClient } from './index'
import type { 
  Category, 
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryList,
  CategoryTree
} from '../types/api'

/**
 * 分类管理API类
 * 处理分类的创建、查询、更新、删除等操作
 */
export class CategoryAPI {

  /**
   * 获取分类列表
   */
  async getCategories(params?: {
    accountBookId?: string
    type?: 'INCOME' | 'EXPENSE'
    page?: number
    pageSize?: number
    search?: string
  }): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories', { params })
    return response.data
  }

  /**
   * 获取分类树结构
   */
  async getCategoryTree(params?: {
    accountBookId?: string
    type?: 'INCOME' | 'EXPENSE'
  }): Promise<CategoryTree[]> {
    const response = await apiClient.get<CategoryTree[]>('/categories/tree', { params })
    return response.data
  }

  /**
   * 获取单个分类
   */
  async getCategory(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`)
    return response.data
  }

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data)
    return response.data
  }

  /**
   * 更新分类
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${id}`, data)
    return response.data
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`)
  }

  /**
   * 批量删除分类
   */
  async deleteCategoriesBatch(ids: string[]): Promise<void> {
    await apiClient.post('/categories/batch-delete', { ids })
  }

  /**
   * 获取默认分类
   */
  async getDefaultCategories(type?: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories/default', {
      params: { type }
    })
    return response.data
  }

  /**
   * 复制分类到账本
   */
  async copyCategoriesToAccountBook(
    sourceAccountBookId: string,
    targetAccountBookId: string,
    categoryIds?: string[]
  ): Promise<Category> {
    const response = await apiClient.post<Category>('/categories/copy', {
      sourceAccountBookId,
      targetAccountBookId,
      categoryIds
    })
    return response.data
  }

  /**
   * 批量创建分类
   */
  async createCategoriesBatch(categories: CreateCategoryRequest[]): Promise<Category[]> {
    const response = await apiClient.post<Category[]>('/categories/batch', { categories })
    return response.data
  }

  /**
   * 获取分类统计信息
   */
  async getCategoryStats(id: string, params?: {
    startDate?: string
    endDate?: string
    accountBookId?: string
  }): Promise<{
    transactionCount: number
    totalAmount: number
    averageAmount: number
    monthlyStats: Array<{
      month: string
      count: number
      amount: number
    }>
  }> {
    const response = await apiClient.get(`/categories/${id}/stats`, { params })
    return response.data
  }

  /**
   * 搜索分类
   */
  async searchCategories(params: {
    query: string
    accountBookId?: string
    type?: 'INCOME' | 'EXPENSE'
    limit?: number
  }): Promise<CategoryTree[]> {
    const response = await apiClient.get<CategoryTree[]>('/categories/search', { params })
    return response.data
  }

  /**
   * 获取热门分类
   */
  async getPopularCategories(params?: {
    accountBookId?: string
    type?: 'INCOME' | 'EXPENSE'
    limit?: number
  }): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories/popular', { params })
    return response.data
  }

  /**
   * 智能匹配分类
   */
  async matchCategories(params: {
    description: string
    amount?: number
    type?: 'INCOME' | 'EXPENSE'
    accountBookId?: string
    limit?: number
  }): Promise<Array<{
    category: Category
    confidence: number
    reason: string
  }>> {
    const response = await apiClient.post('/categories/match', params)
    return response.data
  }

  /**
   * 批量匹配分类
   */
  async matchCategoriesBatch(items: Array<{
    description: string
    amount?: number
    type?: 'INCOME' | 'EXPENSE'
  }>, params?: {
    accountBookId?: string
    threshold?: number
  }): Promise<Category[]> {
    const response = await apiClient.post<Category[]>('/categories/batch-match', {
      items,
      ...params
    })
    return response.data
  }
}

// 创建分类API实例
export const categoryAPI = new CategoryAPI() 