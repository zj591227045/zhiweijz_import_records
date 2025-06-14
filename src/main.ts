import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// 强制设置调试模式
const isElectron = !!(typeof window !== 'undefined' && (
  (window as any).process?.type === 'renderer' ||
  (window as any).isElectron ||
  window.navigator.userAgent.includes('Electron') ||
  window.location.protocol === 'file:'
))

console.log('🚀 Vue应用初始化...')
console.log('📊 环境信息:')
console.log('  - 开发模式:', import.meta.env.DEV)
console.log('  - 生产模式:', import.meta.env.PROD)
console.log('  - Electron环境:', isElectron)
console.log('  - Base URL:', import.meta.env.BASE_URL)
console.log('  - 当前URL:', window.location.href)
console.log('  - 协议:', window.location.protocol)

// 增强的Electron环境检测
function detectElectronEnvironment() {
  const detections = {
    hasWindow: typeof window !== 'undefined',
    hasProcess: false,
    processType: 'unknown',
    userAgent: '',
    protocol: '',
    isElectronUA: false,
    isFileProtocol: false,
    hasElectronGlobal: false
  }

  if (typeof window !== 'undefined') {
    // 检测process对象
    detections.hasProcess = !!(window as any).process
    detections.processType = (window as any).process?.type || 'unknown'
    
    // 检测用户代理
    detections.userAgent = window.navigator.userAgent
    detections.isElectronUA = detections.userAgent.includes('Electron')
    
    // 检测协议
    detections.protocol = window.location.protocol
    detections.isFileProtocol = detections.protocol === 'file:'
    
    // 检测全局Electron标识
    detections.hasElectronGlobal = !!(window as any).isElectron
  }

  // 综合判断是否为Electron环境
  const finalIsElectron = detections.hasWindow && (
    detections.processType === 'renderer' ||
    detections.isElectronUA ||
    detections.isFileProtocol ||
    detections.hasElectronGlobal
  )

  console.log('🔍 详细环境检测结果:', detections)
  console.log('📱 最终判断为Electron:', finalIsElectron)

  return { isElectron: finalIsElectron, detections }
}

const { isElectron: envIsElectron, detections } = detectElectronEnvironment()

// 全局错误处理
const errorHandler = (error: Event | PromiseRejectionEvent, type: string) => {
  console.error(`❌ ${type}错误:`, error)
  if (error instanceof ErrorEvent) {
    console.error('  - 消息:', error.message)
    console.error('  - 文件:', error.filename)
    console.error('  - 行号:', error.lineno)
    console.error('  - 列号:', error.colno)
  }
}

window.addEventListener('error', (e) => errorHandler(e, '全局'))
window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Promise拒绝错误:', e.reason)
  errorHandler(e, 'Promise')
})

// Vue应用创建和配置
async function initializeApp() {
  try {
    console.log('🔧 创建Vue应用...')
    const app = createApp(App)

    // 全局错误处理
    app.config.errorHandler = (err, instance, info) => {
      console.error('❌ Vue应用错误:', err)
      console.error('  - 实例:', instance)
      console.error('  - 信息:', info)
    }

    // 开发模式配置
    if (import.meta.env.DEV) {
      app.config.performance = true
      console.log('✅ 启用Vue性能监控')
    }

    console.log('📦 安装Pinia...')
    const pinia = createPinia()
    app.use(pinia)

    console.log('🧭 安装路由...')
    app.use(router)

    console.log('🎨 安装ElementPlus...')
    app.use(ElementPlus)

    // 注册Element Plus图标
    console.log('🎭 注册图标组件...')
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }

    console.log('✅ 所有插件安装完成')
    return app
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
    throw error
  }
}

// DOM挂载函数
function mountApp(app: ReturnType<typeof createApp>) {
  return new Promise<void>((resolve, reject) => {
    try {
      console.log('🎯 查找挂载点...')
      const mountPoint = document.getElementById('app')
      
      if (!mountPoint) {
        throw new Error('找不到挂载点 #app')
      }

      console.log('✅ 找到挂载点:', mountPoint)
      console.log('📏 挂载点信息:')
      console.log('  - tagName:', mountPoint.tagName)
      console.log('  - id:', mountPoint.id)
      console.log('  - className:', mountPoint.className)
      console.log('  - innerHTML长度:', mountPoint.innerHTML.length)

      // 清空挂载点
      if (mountPoint.innerHTML.trim()) {
        console.log('🧹 清空挂载点内容')
        mountPoint.innerHTML = ''
      }

      console.log('⚡ 开始挂载Vue应用...')
      const vueInstance = app.mount('#app')
      
      console.log('✅ Vue应用挂载成功:', vueInstance)
      
      // 验证挂载结果
      setTimeout(() => {
        console.log('🔍 挂载后验证:')
        console.log('  - 挂载点内容长度:', mountPoint.innerHTML.length)
        console.log('  - 挂载点内容预览:', mountPoint.innerHTML.substring(0, 200))
        
        if (mountPoint.innerHTML.length === 0) {
          console.error('❌ 挂载后内容为空，可能挂载失败')
          reject(new Error('挂载后内容为空'))
        } else {
          console.log('✅ 挂载验证通过')
          resolve()
        }
      }, 1000)
      
    } catch (error) {
      console.error('❌ 挂载过程出错:', error)
      reject(error)
    }
  })
}

// 等待路由就绪
async function waitForRouter() {
  try {
    console.log('⏳ 等待路由就绪...')
    await router.isReady()
    console.log('✅ 路由已就绪')
    console.log('📍 当前路由:', router.currentRoute.value.path)
    console.log('📊 路由信息:', {
      path: router.currentRoute.value.path,
      name: router.currentRoute.value.name,
      params: router.currentRoute.value.params,
      query: router.currentRoute.value.query
    })
  } catch (error) {
    console.error('❌ 路由就绪失败:', error)
    throw error
  }
}

// 主启动函数
async function startApp() {
  console.log('🎬 开始启动应用...')
  
  try {
    // 创建应用
    const app = await initializeApp()
    
    // 等待DOM就绪
    if (document.readyState === 'loading') {
      console.log('⏳ 等待DOM加载...')
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve)
      })
    }
    console.log('✅ DOM已就绪')

    // 挂载应用
    await mountApp(app)
    
    // 等待路由就绪
    await waitForRouter()
    
    console.log('🎉 应用启动完成!')
    console.log('📊 最终环境总结:', {
      isElectron: envIsElectron,
      routerMode: envIsElectron ? 'hash' : 'history',
      currentPath: router.currentRoute.value.path,
      detections
    })

    // 在Electron环境中添加额外的调试信息
    if (envIsElectron) {
      console.log('🖥️ Electron环境额外信息:')
      console.log('  - window.process:', (window as any).process)
      console.log('  - window.isElectron:', (window as any).isElectron)
      console.log('  - 用户代理:', navigator.userAgent)
    }
    
  } catch (error) {
    console.error('💥 应用启动失败:', error)
    
    // 显示错误信息到页面
    const errorElement = document.createElement('div')
    errorElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f56565;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 9999;
      max-width: 80%;
      text-align: center;
    `
    errorElement.innerHTML = `
      <h3>应用启动失败</h3>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>请检查控制台获取详细错误信息</p>
    `
    document.body.appendChild(errorElement)
  }
}

// 启动应用
startApp()
