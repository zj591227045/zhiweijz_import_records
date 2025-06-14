#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

console.log('🔧 测试Electron环境修复效果...')
console.log('')

console.log('📋 修复内容摘要:')
console.log('  ✅ 修复了Electron主进程配置')
console.log('     - 启用了nodeIntegration和关闭contextIsolation')
console.log('     - 注入了process对象和Electron环境标识')
console.log('     - 添加了详细的错误监听和调试信息')
console.log('')
console.log('  ✅ 增强了Electron环境检测逻辑')
console.log('     - 多重检测: process.type、userAgent、协议、全局标识')
console.log('     - 在路由和main.ts中使用相同的检测逻辑')
console.log('     - 强制在Electron中使用hash路由模式')
console.log('')
console.log('  ✅ 修复了Vite构建配置')
console.log('     - 始终使用相对路径 (base: "./") ')
console.log('     - 修复了资源加载路径问题')
console.log('     - 确保文件协议下能正确加载资源')
console.log('')

console.log('🚀 启动测试应用...')
console.log('📊 检查控制台输出，应该能看到:')
console.log('  - "Is Electron: true" (而不是false或undefined)')
console.log('  - 详细的环境检测信息')
console.log('  - "Router is ready" 消息')
console.log('  - 应用正常显示 (不再白屏)')
console.log('')

// 启动开发模式测试
console.log('🔍 启动开发模式测试...')
const electronPath = path.join(__dirname, '../node_modules/.bin/electron')
const mainPath = path.join(__dirname, '../electron/main.js')

const electronProcess = spawn('electron', ['.'], {
  cwd: path.join(__dirname, '..'),
  env: { 
    ...process.env, 
    NODE_ENV: 'development'
  },
  stdio: 'inherit'
})

electronProcess.on('close', (code) => {
  console.log('')
  console.log('📊 测试结果:')
  if (code === 0) {
    console.log('  ✅ Electron应用正常退出')
  } else {
    console.log('  ❌ Electron应用异常退出，代码:', code)
  }
  
  console.log('')
  console.log('🔍 如果应用仍有问题，请检查:')
  console.log('  1. 控制台是否显示 "Is Electron: true"')
  console.log('  2. 是否使用了hash路由模式')
  console.log('  3. 资源文件是否正确加载')
  console.log('')
  console.log('💡 打包应用测试命令:')
  console.log('  macOS: npm run build:mac')
  console.log('  Windows: npm run build:win')
})

electronProcess.on('error', (err) => {
  console.error('❌ 启动Electron失败:', err.message)
}) 