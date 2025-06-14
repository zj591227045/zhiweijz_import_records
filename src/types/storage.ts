import type { UserInfo, AccountBook, Category } from './api'
import type { ServerConfig, ImportRecord, CategoryMapping, PreviewData } from './import'

// 本地存储数据结构
export interface StorageData {
  serverConfig: ServerConfigStorage;
  userSession: UserSessionStorage;
  importSession: ImportSessionStorage;
  appSettings: AppSettingsStorage;
}

// 服务器配置存储
export interface ServerConfigStorage {
  type: 'official' | 'custom';
  customUrl?: string;
  lastUsed: string;
  history: ServerConfig[];
}

// 用户会话存储
export interface UserSessionStorage {
  token?: string;
  refreshToken?: string;
  userInfo?: UserInfo;
  accountBooks?: AccountBook[];
  categories?: Category[];
  selectedAccountBookId?: string;
  lastLoginTime?: string;
  autoLogin: boolean;
}

// 导入会话存储
export interface ImportSessionStorage {
  fileData?: ImportRecord[];
  mappingConfig?: CategoryMapping[];
  previewData?: PreviewData;
  importProgress?: ImportProgress;
  lastImportTime?: string;
}

// 导入进度
export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isRunning: boolean;
  startTime: string;
  estimatedEndTime?: string;
  currentBatch: number;
  totalBatches: number;
}

// 应用设置存储
export interface AppSettingsStorage {
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  batchSize: number;
  enableNotifications: boolean;
  maxFileSize: number; // MB
  supportedFormats: string[];
  defaultCurrency: string;
}

// 存储键名常量
export const STORAGE_KEYS = {
  SERVER_CONFIG: 'import_app_server_config',
  USER_SESSION: 'import_app_user_session',
  IMPORT_SESSION: 'import_app_import_session',
  APP_SETTINGS: 'import_app_settings',
  CATEGORY_MAPPING_RULES: 'import_app_mapping_rules',
} as const;

// 加密存储配置
export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
  encryptFields: string[];
}

// 存储管理器接口
export interface StorageManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  encrypt(data: any): string;
  decrypt(encryptedData: string): any;
} 