// API相关常量
export const API_CONFIG = {
  OFFICIAL_SERVER: 'https://api.zhiweijz.com',
  REQUEST_TIMEOUT: 30000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000,
} as const;

// 文件处理常量
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['.xlsx', '.xls', '.csv'],
  SUPPORTED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  BATCH_SIZE: 50,
  CHUNK_SIZE: 1000,
} as const;

// 导入步骤配置
export const IMPORT_STEPS = [
  { key: 'server-config', title: '服务器配置', description: '配置API服务器' },
  { key: 'login', title: '用户登录', description: '验证用户身份' },
  { key: 'account-book', title: '选择账本', description: '选择目标账本' },
  { key: 'file-upload', title: '上传文件', description: '上传数据文件' },
  { key: 'category-mapping', title: '分类映射', description: '配置分类映射' },
  { key: 'data-preview', title: '数据预览', description: '预览导入数据' },
  { key: 'import-execute', title: '执行导入', description: '批量导入数据' },
  { key: 'import-report', title: '导入报告', description: '查看导入结果' },
] as const;

// 默认应用设置
export const DEFAULT_APP_SETTINGS = {
  language: 'zh-CN',
  theme: 'light',
  autoSave: true,
  batchSize: 50,
  enableNotifications: true,
  maxFileSize: 10,
  supportedFormats: ['.xlsx', '.xls', '.csv'],
  defaultCurrency: 'CNY',
} as const;

// 分类映射规则
export const CATEGORY_MAPPING_RULES = {
  // 餐饮类关键词
  DINING: ['餐厅', '美食', '外卖', '饭店', '咖啡', '奶茶', '麦当劳', '肯德基', '必胜客'],
  
  // 购物类关键词  
  SHOPPING: ['购物', '商店', '超市', '淘宝', '京东', '天猫', '拼多多', '商场', '百货'],
  
  // 交通类关键词
  TRANSPORT: ['交通', '地铁', '公交', '出租车', '滴滴', '加油', '停车', '高速', '火车', '飞机'],
  
  // 娱乐类关键词
  ENTERTAINMENT: ['电影', '游戏', '音乐', '书籍', '旅游', '酒店', '景点', '健身', '运动'],
  
  // 生活类关键词
  DAILY: ['水电费', '话费', '网费', '房租', '物业', '医疗', '药品', '理发', '洗衣'],
  
  // 收入类关键词
  INCOME: ['工资', '奖金', '补贴', '分红', '利息', '退款', '报销', '收入'],
} as const;

// 数据验证规则
export const VALIDATION_RULES = {
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  AMOUNT_FORMAT: /^-?\d+(\.\d{1,2})?$/,
  DESCRIPTION_MAX_LENGTH: 100,
  CATEGORY_MAX_LENGTH: 50,
  NOTES_MAX_LENGTH: 500,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  AUTH_FAILED: '身份验证失败，请重新登录',
  FILE_TOO_LARGE: '文件大小超过限制',
  FILE_FORMAT_UNSUPPORTED: '不支持的文件格式',
  PARSE_ERROR: '文件解析失败',
  VALIDATION_ERROR: '数据验证失败',
  IMPORT_ERROR: '数据导入失败',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  FILE_UPLOAD_SUCCESS: '文件上传成功',
  IMPORT_SUCCESS: '数据导入成功',
  CONFIG_SAVED: '配置保存成功',
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  SERVER_CONFIG: 'import_app_server_config',
  USER_SESSION: 'import_app_user_session',
  IMPORT_SESSION: 'import_app_import_session',
  APP_SETTINGS: 'import_app_settings',
  CATEGORY_MAPPING_RULES: 'import_app_mapping_rules',
} as const;

// 加密配置
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES',
  KEY_SIZE: 256,
  ITERATIONS: 1000,
  ENCRYPT_FIELDS: ['token', 'refreshToken', 'password'] as string[],
} as const;

// 主题色彩配置
export const THEME_COLORS = {
  PRIMARY: '#409EFF',
  SUCCESS: '#67C23A',
  WARNING: '#E6A23C',
  DANGER: '#F56C6C',
  INFO: '#909399',
} as const;

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const; 