import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import type { RouteMeta } from '@/types/common'

// 扩展路由元信息
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
  }
}

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
  const isElectron = detections.hasWindow && (
    detections.processType === 'renderer' ||
    detections.isElectronUA ||
    detections.isFileProtocol ||
    detections.hasElectronGlobal
  )

  console.log('🔍 Electron Environment Detection:', detections)
  console.log('📱 Is Electron:', isElectron)

  return isElectron
}

const isElectron = detectElectronEnvironment()

const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
      meta: {
        title: '首页',
        requiresAuth: false
      }
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('@/views/ImportWizard.vue'),
      meta: {
        title: '导入向导',
        requiresAuth: false
      }
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('@/views/ImportReport.vue'),
      meta: {
        title: '导入报告',
        requiresAuth: false
      }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log('🧭 Router navigation:', {
    from: from.path,
    to: to.path,
    isElectron,
    historyMode: isElectron ? 'hash' : 'history'
  })
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 记账数据导入工具`
  }
  
  next()
})

export default router
