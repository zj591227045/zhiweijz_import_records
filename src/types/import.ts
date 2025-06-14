// 导入记录原始数据
export interface ImportRecord {
  rowIndex?: number;
  date: Date;
  description: string;
  amount: number;
  category: string;
  direction?: 'income' | 'expense';
  budget?: string; // 预算字段（原成员字段）
  member?: string; // 家庭成员字段
  tags?: string[];
  notes?: string;
  originalData?: Record<string, any>;
}

// 文件解析结果
export interface ParseResult {
  success: boolean;
  data: ImportRecord[];
  errors: ParseError[];
  metadata?: {
    fileName: string;
    fileSize: number;
    totalRows: number;
    headers?: string[];
    sheetName?: string;
  };
}

export interface ParseError {
  row: number;
  field?: string;
  column?: string;
  value?: any;
  message: string;
}

// 分类映射配置
export interface CategoryMapping {
  mappings: Record<string, string>; // 原始分类 -> 目标分类ID
  unmappedCategories: string[]; // 未映射的分类列表
  budgetMappings?: Record<string, string>; // 原始预算 -> 目标预算ID
  unmappedBudgets?: string[]; // 未映射的预算列表
  memberMappings?: Record<string, string>; // 成员映射
  unmappedMembers?: string[]; // 未映射的成员列表
}

export interface CategoryMappingItem {
  originalCategory: string;
  targetCategoryId: string;
  targetCategoryName: string;
  confidence: number;
  isManual: boolean;
}

export interface CategoryMatch {
  targetCategoryId: string;
  targetCategoryName: string;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'keyword' | 'default';
}

// 映射规则
export interface MappingRule {
  keywords: string[];
  targetCategoryId: string;
  confidence: number;
  type: 'exact' | 'fuzzy' | 'regex';
  direction?: 'income' | 'expense';
}

// 导入进度状态
export interface ImportProgress {
  status: 'ready' | 'preparing' | 'importing' | 'completed' | 'failed' | 'undoing';
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

// 导入状态（兼容性）
export interface ImportState {
  currentStep: number;
  isLoading: boolean;
  error?: string;
}

// 导入步骤
export type ImportStep = 
  | 'server-config' 
  | 'login' 
  | 'account-book' 
  | 'file-upload' 
  | 'category-mapping' 
  | 'data-preview' 
  | 'import-execute' 
  | 'import-report';

// 导入会话状态
export interface ImportSession {
  currentStep: ImportStep;
  serverConfig?: ServerConfig;
  userInfo?: UserInfo;
  selectedAccountBook?: AccountBook;
  uploadedFile?: File;
  parsedData?: ImportRecord[];
  categoryMappings?: CategoryMapping[];
  previewData?: PreviewData;
  importResult?: ImportResult;
}

// 预览数据
export interface PreviewData {
  records: ImportRecord[];
  statistics: ImportStatistics;
  validation: ValidationResult;
}

export interface ImportStatistics {
  totalRecords: number;
  incomeRecords: number;
  expenseRecords: number;
  totalAmount: number;
  incomeAmount: number;
  expenseAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
  categories: {
    [categoryId: string]: {
      name: string;
      count: number;
      amount: number;
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  index: number;
  field: string;
  value: any;
  message: string;
}

export interface ValidationWarning {
  index: number;
  field: string;
  value: any;
  message: string;
}

// 文件解析器接口
export interface FileParser {
  supportedFormats: string[];
  parse(file: File): Promise<ParseResult>;
  validate(data: ImportRecord[]): ValidationResult;
}

// 服务器配置
export interface ServerConfig {
  type: 'official' | 'custom';
  url: string;
  isConnected: boolean;
  lastConnectedAt?: string;
}

import type { UserInfo, AccountBook, ImportResult } from './api' 