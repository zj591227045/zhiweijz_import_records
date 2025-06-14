import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type { 
  ApiResponse, 
  ImportError
} from '../types/api'

// 临时类型定义（如果types/api中没有定义）
interface RequestInterceptor {
  onFulfilled?: (config: any) => any
  onRejected?: (error: any) => any
}

interface ResponseInterceptor {
  onFulfilled?: (response: any) => any
  onRejected?: (error: any) => any
}

// 添加缺失的类型定义
export interface ApiError {
  message: string
  code?: number
  details?: any
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface HealthCheckResponse {
  status: 'ok' | 'error'
  message?: string
  timestamp: string
}

export interface BatchRequest<T = any> {
  items: T[]
  batchSize?: number
}

export interface BatchResponse<T = any> {
  results: T[]
  errors: ImportError[]
}

/**
 * 基础API客户端类
 * 提供统一的HTTP请求封装、错误处理、拦截器管理
 */
export class ApiClient {
  private instance: AxiosInstance
  private baseURL: string = ''
  private timeout: number
  private authToken: string = ''
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private isBatchOperation: boolean = false // 添加批量操作标记

  constructor(baseURL?: string) {
    if (baseURL) {
      this.baseURL = baseURL
    }
    
    this.timeout = 15000

    // 创建axios实例
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 设置默认拦截器
    this.setupInterceptors()
    this.restoreConfig()
  }

  /**
   * 设置基础URL
   */
  setBaseURL(baseURL: string): void {
    // 移除末尾的斜杠，然后添加/api（如果不存在的话）
    const cleanURL = baseURL.replace(/\/+$/, '')
    const apiBaseURL = cleanURL.endsWith('/api') ? cleanURL : `${cleanURL}/api`
    this.baseURL = apiBaseURL
    this.instance.defaults.baseURL = apiBaseURL
    
    // 保存到localStorage
    localStorage.setItem('api_base_url', baseURL) // 保存原始URL，不包含/api
  }

  /**
   * 从localStorage恢复配置
   */
  restoreConfig(): void {
    const savedBaseURL = localStorage.getItem('api_base_url')
    const savedToken = localStorage.getItem('auth_token')
    
    if (savedBaseURL) {
      this.setBaseURL(savedBaseURL) // setBaseURL会自动添加/api
    }
    
    if (savedToken) {
      this.setAuthToken(savedToken)
    }
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.authToken = token
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    // 保存到localStorage
    localStorage.setItem('auth_token', token)
  }

  /**
   * 移除认证令牌
   */
  removeAuthToken(): void {
    this.authToken = ''
    delete this.instance.defaults.headers.common['Authorization']
    
    // 从localStorage移除
    localStorage.removeItem('auth_token')
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
    this.instance.interceptors.request.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    )
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
    this.instance.interceptors.response.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    )
  }

  /**
   * 设置默认拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 确保使用最新的baseURL
        if (this.baseURL) {
          config.baseURL = this.baseURL
        }
        
        // 确保从localStorage获取最新的token（防止token被意外清除但localStorage中还有）
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken && !this.authToken) {
          console.log('[API Request] Restoring token from localStorage:', storedToken.substring(0, 20) + '...')
          this.authToken = storedToken
        }
        
        // 添加认证token
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
          console.log('[API Request] Token added to headers:', this.authToken.substring(0, 20) + '...')
        } else if (storedToken) {
          // 如果实例中没有token但localStorage中有，直接使用
          config.headers.Authorization = `Bearer ${storedToken}`
          console.log('[API Request] Using token from localStorage:', storedToken.substring(0, 20) + '...')
        } else {
          console.warn('[API Request] No auth token available!')
        }

        // 添加开始时间用于计算duration（使用config的自定义属性，不会被发送到服务器）
        const requestId = this.generateRequestId()
        // 使用内部属性存储，避免与请求体混淆
        ;(config as any).__metadata = { startTime: Date.now(), requestId }

        // 添加调试日志检查数据是否被包装
        console.log(`[API Request Debug] Original data:`, config.data)
        
        // 检查是否有意外的数据包装
        if (config.data && typeof config.data === 'object') {
          // 如果data被包装在额外结构中，解包它
          if (config.data.requestId && config.data.data) {
            console.warn(`[API Request] Detected wrapped data, unwrapping...`)
            config.data = config.data.data
          }
        }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
          requestId,
          data: config.data,
          params: config.params,
          hasAuth: !!config.headers.Authorization
        })

        return config
      },
      (error) => {
        console.error('[API Request Error]', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const duration = (response.config as any).__metadata?.startTime 
          ? `${Date.now() - (response.config as any).__metadata.startTime}ms`
          : 'unknown'

        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          requestId: (response.config as any).__metadata?.requestId,
          status: response.status,
          duration,
          data: response.data
        })

        return response
      },
      (error: AxiosError<ApiError>) => {
        const config = error.config
        const duration = (config as any)?.__metadata?.startTime 
          ? `${Date.now() - (config as any).__metadata.startTime}ms`
          : 'unknown'

        console.error(`[API Error] ${config?.method?.toUpperCase()} ${config?.url}`, {
          requestId: (config as any)?.__metadata?.requestId,
          duration,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
          fullError: error.response,
          hadAuthHeader: !!config?.headers?.Authorization
        })
        
        // 专门输出详细的错误信息用于调试
        console.error('[DETAILED ERROR]', {
          requestData: config?.data,
          responseData: error.response?.data,
          responseStatus: error.response?.status,
          responseHeaders: error.response?.headers,
          authHeader: config?.headers?.Authorization ? 'Present' : 'Missing'
        })

        // 处理特定错误 - 添加更多调试信息
        if (error.response?.status === 401) {
          console.error('[AUTH ERROR] Token validation failed:', {
            storedToken: localStorage.getItem('auth_token') ? 'Present' : 'Missing',
            instanceToken: this.authToken ? 'Present' : 'Missing',
            requestUrl: config?.url
          })
          
          // 区分登录请求和其他请求的 401 错误
          if (config?.url?.includes('/auth/login')) {
            // 登录请求的 401 错误，显示具体的错误信息
            const errorMessage = error.response?.data?.message || '用户名或密码错误'
            ElMessage.error(errorMessage)
          } else {
            // 其他请求的 401 错误，处理为未授权
            this.handleUnauthorized()
          }
        } else if (error.response?.status && error.response.status >= 500) {
          ElMessage.error('服务器错误，请稍后重试')
        } else if (!error.response) {
          ElMessage.error('网络连接失败，请检查网络设置')
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * 统一错误处理
   */
  private handleError(error: any): void {
    let message = '网络请求失败'

    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data?.message || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 可以在这里触发登出逻辑
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        default:
          message = data?.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 网络错误
      if (error.code === 'ECONNABORTED') {
        message = '请求超时'
      } else if (error.code === 'ERR_NETWORK') {
        message = '网络连接失败'
      } else {
        message = '网络请求失败'
      }
    } else if (error.name === 'BusinessError') {
      // 业务错误
      message = error.message
    }

    // 显示错误提示
    ElMessage.error(message)
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * 上传文件
   */
  async upload<T = any>(url: string, file: File, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
    return response.data
  }

  /**
   * 下载文件
   */
  async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob'
    })

    // 创建下载链接
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  /**
   * 批量请求
   */
  async batch<T = any>(requests: Promise<any>[]): Promise<T[]> {
    const results = await Promise.allSettled(requests)
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Batch request ${index} failed:`, result.reason)
        throw result.reason
      }
    })
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health')
      return response.success !== false
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  /**
   * 强制从localStorage恢复认证状态
   */
  forceRestoreAuth(): boolean {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      console.log('[AUTH] Force restoring token from localStorage')
      this.setAuthToken(storedToken)
      return true
    }
    return false
  }

  /**
   * 设置批量操作标记
   */
  setBatchOperation(isBatch: boolean): void {
    this.isBatchOperation = isBatch
    console.log('[API] Batch operation mode:', isBatch ? 'ENABLED' : 'DISABLED')
  }

  private handleUnauthorized(): void {
    console.error('[AUTH] Handling unauthorized error - current state:', {
      instanceToken: this.authToken ? 'Present' : 'Missing',
      storedToken: localStorage.getItem('auth_token') ? 'Present' : 'Missing',
      isBatchOperation: this.isBatchOperation,
      timestamp: new Date().toISOString()
    })
    
    if (this.isBatchOperation) {
      // 在批量操作期间，不立即清除令牌，给一次机会恢复
      console.warn('[AUTH] In batch operation, attempting token recovery...')
      if (this.forceRestoreAuth()) {
        console.log('[AUTH] Token recovered during batch operation')
        return
      }
    }
    
    ElMessage.error('登录已过期，请重新登录')
    this.removeAuthToken()
    // 这里可以添加跳转到登录页面的逻辑
  }

  /**
   * 调试方法：检查当前认证状态
   */
  debugAuthState(): void {
    console.log('[DEBUG AUTH STATE]', {
      instanceToken: this.authToken ? this.authToken.substring(0, 20) + '...' : 'Missing',
      storedToken: localStorage.getItem('auth_token') ? localStorage.getItem('auth_token')?.substring(0, 20) + '...' : 'Missing',
      defaultHeaders: this.instance.defaults.headers.common['Authorization'] ? 'Present' : 'Missing',
      baseURL: this.baseURL,
      timestamp: new Date().toISOString()
    })
  }
}

// 创建单例实例
export const apiClient = new ApiClient()

// 导出类型
export type { ApiResponse, ImportError } from '../types/api' 