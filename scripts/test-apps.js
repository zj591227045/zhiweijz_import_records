#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🧪 测试打包后的应用...')

const distElectronDir = path.join(__dirname, '../dist-electron')

// 查找应用文件
function findApps() {
  const apps = []
  
  // macOS应用
  const macDirs = ['mac', 'mac-arm64']
  macDirs.forEach(dir => {
    const macPath = path.join(distElectronDir, dir)
    if (fs.existsSync(macPath)) {
      const appDirs = fs.readdirSync(macPath).filter(name => name.endsWith('.app'))
      appDirs.forEach(appDir => {
        apps.push({
          platform: 'macOS',
          arch: dir.includes('arm64') ? 'Apple Silicon' : 'Intel',
          path: path.join(macPath, appDir),
          executable: path.join(macPath, appDir, 'Contents', 'MacOS', '记账数据导入工具')
        })
      })
    }
  })
  
  // Windows应用
  const winDirs = ['win-unpacked', 'win-ia32-unpacked']
  winDirs.forEach(dir => {
    const winPath = path.join(distElectronDir, dir)
    if (fs.existsSync(winPath)) {
      const exePath = path.join(winPath, '记账数据导入工具.exe')
      if (fs.existsSync(exePath)) {
        apps.push({
          platform: 'Windows',
          arch: dir.includes('ia32') ? 'x86' : 'x64',
          path: winPath,
          executable: exePath
        })
      }
    }
  })
  
  return apps
}

// 测试应用启动
function testApp(app) {
  return new Promise((resolve) => {
    console.log(`🚀 测试 ${app.platform} ${app.arch} 版本...`)
    
    const child = spawn(app.executable, [], {
      stdio: 'pipe',
      detached: true
    })
    
    let output = ''
    let errorOutput = ''
    
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    // 等待3秒后检查进程状态
    setTimeout(() => {
      const isRunning = !child.killed && child.exitCode === null
      
      if (isRunning) {
        console.log(`✅ ${app.platform} ${app.arch} 启动成功`)
        child.kill()
        resolve({ success: true, app })
      } else {
        console.log(`❌ ${app.platform} ${app.arch} 启动失败`)
        if (errorOutput) {
          console.log(`   错误信息: ${errorOutput.slice(0, 200)}...`)
        }
        resolve({ success: false, app, error: errorOutput })
      }
    }, 3000)
    
    child.on('error', (error) => {
      console.log(`❌ ${app.platform} ${app.arch} 启动失败: ${error.message}`)
      resolve({ success: false, app, error: error.message })
    })
  })
}

async function main() {
  try {
    const apps = findApps()
    
    if (apps.length === 0) {
      console.log('⚠️ 未找到打包后的应用')
      console.log('请先运行: npm run build:complete')
      process.exit(1)
    }
    
    console.log(`📋 找到 ${apps.length} 个应用:`)
    apps.forEach(app => {
      console.log(`  - ${app.platform} ${app.arch}`)
    })
    
    console.log('\n🧪 开始测试...')
    
    // 只在macOS上测试macOS应用
    const macApps = apps.filter(app => app.platform === 'macOS')
    const results = []
    
    if (process.platform === 'darwin' && macApps.length > 0) {
      for (const app of macApps) {
        const result = await testApp(app)
        results.push(result)
      }
    } else {
      console.log('⚠️ 当前系统不是macOS，跳过macOS应用测试')
    }
    
    // 显示测试结果
    console.log('\n📊 测试结果:')
    const successCount = results.filter(r => r.success).length
    console.log(`✅ 成功: ${successCount}/${results.length}`)
    
    if (successCount === results.length && results.length > 0) {
      console.log('🎉 所有应用测试通过！')
    } else if (results.length === 0) {
      console.log('⚠️ 没有进行任何测试')
    } else {
      console.log('⚠️ 部分应用测试失败')
    }
    
    console.log('\n💡 手动测试建议:')
    apps.forEach(app => {
      if (app.platform === 'macOS') {
        console.log(`  ${app.platform} ${app.arch}: open "${app.path}"`)
      } else {
        console.log(`  ${app.platform} ${app.arch}: "${app.executable}"`)
      }
    })
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { findApps, testApp } 