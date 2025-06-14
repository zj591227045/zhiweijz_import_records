// 通用响应类型
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
  timestamp?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

// 分页响应
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: PaginationParams;
}

// 选项类型
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  children?: SelectOption<T>[];
}

// 表格列配置
export interface TableColumn {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  formatter?: (row: any, column: any, cellValue: any) => string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  type?: 'selection' | 'index' | 'expand';
}

// 步骤指示器配置
export interface StepConfig {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  status?: 'wait' | 'process' | 'finish' | 'error' | 'success';
}

// 文件上传状态
export interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
}

// 通知消息类型
export interface NotificationMessage {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message?: string;
  duration?: number;
  showClose?: boolean;
}

// 确认对话框配置
export interface ConfirmConfig {
  title: string;
  message: string;
  type?: 'warning' | 'info' | 'success' | 'error';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

// 加载状态
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// 错误状态
export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string | number;
  details?: any;
}

// 状态管理基础接口
export interface StoreState {
  loading: LoadingState;
  error: ErrorState;
}

// 异步操作结果
export interface AsyncResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  message?: string;
}

// 表单验证规则
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (rule: any, value: any, callback: Function) => void;
  message?: string;
  trigger?: 'blur' | 'change';
}

// 主题配置
export interface ThemeConfig {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  text: {
    primary: string;
    regular: string;
    secondary: string;
    placeholder: string;
  };
  background: {
    base: string;
    page: string;
    overlay: string;
  };
}

// 国际化配置
export interface I18nConfig {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, Record<string, string>>;
}

// 路由元信息
export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  keepAlive?: boolean;
  showInMenu?: boolean;
  icon?: string;
  order?: number;
} 