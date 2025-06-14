// API 基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

// 认证相关
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// 账本相关
export interface AccountBook {
  id: string;
  name: string;
  description?: string;
  userId: string;
  type: 'PERSONAL' | 'FAMILY';
  familyId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  categoryCount: number;
  budgetCount: number;
  currency?: string;
}

export interface AccountBookList {
  total: number;
  page: number;
  limit: number;
  data: AccountBook[];
}

export interface CreateAccountBookRequest {
  name: string;
  description?: string;
  currency?: string;
}

export interface UpdateAccountBookRequest {
  name?: string;
  description?: string;
  currency?: string;
}

export interface AccountBookPermission {
  id: string;
  accountBookId: string;
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// 分类相关
export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  displayOrder: number;
}

export interface CreateCategoryRequest {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  accountBookId?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  displayOrder?: number;
}

export interface CategoryList {
  total: number;
  page: number;
  limit: number;
  data: Category[];
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

// 预算相关
export interface Budget {
  id: string;
  name: string;
  amount: number;
  categoryIds: string[];
  period: 'month' | 'year';
  startDate: string;
  endDate: string;
  accountBookId: string;
  type?: 'PERSONAL' | 'SHARED';
}

// 交易记录相关
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  accountBookId: string;
  direction: 'income' | 'expense';
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateTransactionRequest {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  description?: string;
  date: Date;
  familyId?: string;
  familyMemberId?: string;
  accountBookId?: string;
  budgetId?: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  direction?: 'income' | 'expense';
  tags?: string[];
  notes?: string;
}

export interface TransactionList {
  total: number;
  page: number;
  limit: number;
  data: Transaction[];
}

export interface ImportTransactionRequest {
  transactions: CreateTransactionRequest[];
  budgets?: Omit<Budget, 'id'>[];
}

export interface ImportResult {
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  errors: ImportError[];
  budgetsCreated: number;
}

export interface ImportError {
  index: number;
  data: any;
  error: string;
}

export interface FileImportResult {
  total: number;
  failed: number;
  errors: ImportError[];
} 