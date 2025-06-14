#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🚀 开始完整的构建和修复流程...')

async function main() {
  try {
    // 1. 清理旧的构建文件
    console.log('\n🧹 清理旧的构建文件...')
    const distElectronDir = path.join(__dirname, '../dist-electron')
    if (fs.existsSync(distElectronDir)) {
      fs.rmSync(distElectronDir, { recursive: true, force: true })
      console.log('✅ 清理完成')
    }
    
    // 2. 构建Vue应用
    console.log('\n📦 构建Vue应用...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ Vue应用构建完成')
    
    // 3. 修复构建文件中的路径
    console.log('\n🔧 修复构建文件中的路径...')
    execSync('node scripts/fix-dynamic-imports.js', { stdio: 'inherit' })
    console.log('✅ 构建文件路径修复完成')
    
    // 4. 构建Electron应用
    console.log('\n⚡ 构建Electron应用...')
    execSync('electron-builder --mac --win', { stdio: 'inherit' })
    console.log('✅ Electron应用构建完成')
    
    // 5. 修复打包后的应用
    console.log('\n🔧 修复打包后的应用...')
    execSync('node scripts/fix-packaged-app.js', { stdio: 'inherit' })
    console.log('✅ 打包后应用修复完成')
    
    // 6. 显示构建结果
    console.log('\n📊 构建结果:')
    const files = [
      'dist-electron/记账数据导入工具-0.0.0.dmg',
      'dist-electron/记账数据导入工具-0.0.0-arm64.dmg',
      'dist-electron/记账数据导入工具 Setup 0.0.0.exe',
      'dist-electron/记账数据导入工具 0.0.0.exe'
    ]
    
    files.forEach(file => {
      const filePath = path.join(__dirname, '..', file)
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1)
        console.log(`  ✅ ${path.basename(file)} (${sizeMB}MB)`)
      } else {
        console.log(`  ❌ ${path.basename(file)} (未找到)`)
      }
    })
    
    console.log('\n🎉 构建和修复流程完成！')
    console.log('📱 现在可以测试应用了:')
    console.log('  macOS Intel: open "dist-electron/mac/记账数据导入工具.app"')
    console.log('  macOS Apple Silicon: open "dist-electron/mac-arm64/记账数据导入工具.app"')
    console.log('  Windows: 运行 dist-electron/win-unpacked/记账数据导入工具.exe')
    
  } catch (error) {
    console.error('\n❌ 构建过程中发生错误:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = main 