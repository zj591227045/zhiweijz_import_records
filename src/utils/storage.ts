import CryptoJS from 'crypto-js';
import type { StorageManager, EncryptionConfig } from '@/types/storage';
import { STORAGE_KEYS, ENCRYPTION_CONFIG } from './constants';

/**
 * 本地存储管理器
 * 支持数据加密和自动序列化
 */
class LocalStorageManager implements StorageManager {
  private secretKey: string;
  private encryptionConfig: EncryptionConfig;

  constructor(secretKey: string = 'import-records-app-secret') {
    this.secretKey = secretKey;
    this.encryptionConfig = {
      algorithm: ENCRYPTION_CONFIG.ALGORITHM,
      keySize: ENCRYPTION_CONFIG.KEY_SIZE,
      iterations: ENCRYPTION_CONFIG.ITERATIONS,
      encryptFields: ENCRYPTION_CONFIG.ENCRYPT_FIELDS,
    };
  }

  /**
   * 获取存储数据
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // 尝试解析JSON
      const data = JSON.parse(item);
      
      // 检查是否需要解密
      if (data.__encrypted) {
        return this.decrypt(data.data) as T;
      }
      
      return data as T;
    } catch (error) {
      console.error(`Failed to get data from localStorage for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 设置存储数据
   */
  set<T>(key: string, value: T): void {
    try {
      let dataToStore: any = value;
      
      // 检查是否需要加密
      if (this.shouldEncrypt(key, value)) {
        dataToStore = {
          __encrypted: true,
          data: this.encrypt(value)
        };
      }
      
      localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.error(`Failed to set data to localStorage for key: ${key}`, error);
    }
  }

  /**
   * 删除存储数据
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove data from localStorage for key: ${key}`, error);
    }
  }

  /**
   * 清空所有存储数据
   */
  clear(): void {
    try {
      // 只清除应用相关的数据
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  }

  /**
   * 加密数据
   */
  encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt data', error);
      return JSON.stringify(data);
    }
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Failed to decrypt data', error);
      return null;
    }
  }

  /**
   * 判断是否需要加密
   */
  private shouldEncrypt(key: string, value: any): boolean {
    // 用户会话数据需要加密
    if (key === STORAGE_KEYS.USER_SESSION) {
      return true;
    }
    
    // 检查是否包含敏感字段
    if (typeof value === 'object' && value !== null) {
      return this.containsSensitiveFields(value);
    }
    
    return false;
  }

  /**
   * 检查是否包含敏感字段
   */
  private containsSensitiveFields(obj: any): boolean {
    const checkObject = (target: any): boolean => {
      if (typeof target !== 'object' || target === null) {
        return false;
      }
      
      for (const key in target) {
        if (this.encryptionConfig.encryptFields.includes(key)) {
          return true;
        }
        
        if (typeof target[key] === 'object') {
          if (checkObject(target[key])) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    return checkObject(obj);
  }

  /**
   * 获取存储大小
   */
  getStorageSize(): { used: number; total: number } {
    let used = 0;
    
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage size', error);
    }
    
    // 大多数浏览器的 localStorage 限制是 5MB
    const total = 5 * 1024 * 1024;
    
    return { used, total };
  }

  /**
   * 检查存储可用性
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * SessionStorage 管理器
 * 用于临时数据存储
 */
class SessionStorageManager implements StorageManager {
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get data from sessionStorage for key: ${key}`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set data to sessionStorage for key: ${key}`, error);
    }
  }

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove data from sessionStorage for key: ${key}`, error);
    }
  }

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear sessionStorage', error);
    }
  }

  encrypt(data: any): string {
    return JSON.stringify(data);
  }

  decrypt(encryptedData: string): any {
    try {
      return JSON.parse(encryptedData);
    } catch {
      return null;
    }
  }
}

// 创建存储管理器实例
export const localStorageManager = new LocalStorageManager();
export const sessionStorageManager = new SessionStorageManager();

// 默认导出本地存储管理器
export default localStorageManager; 