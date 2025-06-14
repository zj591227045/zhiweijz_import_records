import { apiClient } from './index'
import type { 
  LoginRequest, 
  LoginResponse, 
  LogoutResponse, 
  UserInfo 
} from '../types/api'

/**
 * 认证API类
 * 处理用户登录、注册、注销等认证相关操作
 */
export class AuthAPI {

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    
    // apiClient.post() 直接返回数据，不是标准的 Axios 响应格式
    // 所以 response 就是数据本身，不需要访问 response.data
    console.log('[AuthAPI] Login response (direct data):', response)
    
    if (response && response.token) {
      apiClient.setAuthToken(response.token)
    }
    
    return response
  }

  /**
   * 用户注册
   */
  async register(data: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }): Promise<{
    success: boolean
    message: string
    user?: UserInfo
  }> {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  }

  /**
   * 用户注销
   */
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/auth/logout')
    
    // 清除本地token
    apiClient.removeAuthToken()
    
    return response.data
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<UserInfo> {
    const response = await apiClient.get<UserInfo>('/auth/me')
    return response.data
  }

  /**
   * 刷新token
   */
  async refreshToken(): Promise<{
    token: string
    refreshToken: string
  }> {
    const response = await apiClient.post('/auth/refresh')
    
    // 更新token
    const data = response.data
    if (data && data.token) {
      apiClient.setAuthToken(data.token)
    }
    
    return data
  }

  /**
   * 重置密码
   */
  async resetPassword(email: string): Promise<{
    success: boolean
    message: string
  }> {
    const response = await apiClient.post('/auth/reset-password', { email })
    return response.data
  }

  /**
   * 确认重置密码
   */
  async confirmResetPassword(token: string, newPassword: string): Promise<{
    success: boolean
    message: string
  }> {
    const response = await apiClient.post('/auth/confirm-reset-password', {
      token,
      password: newPassword
    })
    return response.data
  }

  /**
   * 修改密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{
    success: boolean
    message: string
  }> {
    const response = await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword
    })
    return response.data
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<{
    success: boolean
    message: string
  }> {
    const response = await apiClient.post('/auth/verify-email', { token })
    return response.data
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(): Promise<{
    success: boolean
    message: string
  }> {
    const response = await apiClient.post('/auth/resend-verification')
    return response.data
  }

  /**
   * 验证token有效性
   */
  async validateToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/check')
      return true
    } catch (error) {
      return false
    }
  }
}

// 创建认证API实例
export const authAPI = new AuthAPI() 