#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

console.log('🔍 诊断字符编码问题...')
console.log('')

function checkFileEncoding(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const hasChineseChars = /[\u4e00-\u9fff]/.test(content)
    const bytes = fs.readFileSync(filePath)
    const hasBOM = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF
    
    return {
      exists: true,
      hasChineseChars,
      hasBOM,
      size: bytes.length,
      firstFewBytes: Array.from(bytes.slice(0, 10)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ')
    }
  } catch (error) {
    return {
      exists: false,
      error: error.message
    }
  }
}

console.log('📋 检查关键文件编码:')

const filesToCheck = [
  'index.html',
  'dist/index.html',
  'src/main.ts',
  'src/views/HomePage.vue',
  'electron/main.js'
]

filesToCheck.forEach(file => {
  const result = checkFileEncoding(file)
  console.log(`\n📄 ${file}:`)
  if (result.exists) {
    console.log(`  ✅ 文件存在 (${result.size} bytes)`)
    console.log(`  🔤 包含中文字符: ${result.hasChineseChars ? '是' : '否'}`)
    console.log(`  📝 有BOM标记: ${result.hasBOM ? '是' : '否'}`)
    console.log(`  🔢 前几个字节: ${result.firstFewBytes}`)
  } else {
    console.log(`  ❌ 文件不存在: ${result.error}`)
  }
})

console.log('\n🌍 系统环境检查:')
console.log(`  - 操作系统: ${process.platform}`)
console.log(`  - 架构: ${process.arch}`)
console.log(`  - Node版本: ${process.version}`)
console.log(`  - LANG: ${process.env.LANG || '未设置'}`)
console.log(`  - LC_ALL: ${process.env.LC_ALL || '未设置'}`)
console.log(`  - ELECTRON_DEBUG: ${process.env.ELECTRON_DEBUG || '未设置'}`)

console.log('\n🔧 修复建议:')

// 1. 修复HTML文件，确保有正确的BOM和编码声明
console.log('1. 修复HTML编码设置...')
const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link rel="icon" href="./favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
    <meta name="description" content="记账数据导入工具 - 支持从其他记账应用导入数据到只为记账系统">
    <title>记账数据导入工具</title>
    <script type="module" crossorigin src="./assets/index-DyxPHhFh.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index-DKaYPRL6.css">
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`

// 检查dist/index.html是否存在
if (fs.existsSync('dist/index.html')) {
  // 使用UTF-8 BOM写入
  const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF])
  const htmlContent = Buffer.concat([utf8BOM, Buffer.from(htmlTemplate, 'utf8')])
  fs.writeFileSync('dist/index.html', htmlContent)
  console.log('  ✅ 已修复 dist/index.html 编码')
} else {
  console.log('  ⚠️ dist/index.html 不存在，请先运行 npm run build')
}

// 2. 创建调试启动脚本
console.log('2. 创建调试启动脚本...')
const debugScript = `#!/bin/bash

echo "🔧 启动Electron调试模式..."

# 设置环境变量
export NODE_ENV=development
export ELECTRON_DEBUG=true
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8

# 显示环境信息
echo "📊 环境变量:"
echo "  NODE_ENV: $NODE_ENV"
echo "  ELECTRON_DEBUG: $ELECTRON_DEBUG"
echo "  LANG: $LANG"
echo "  LC_ALL: $LC_ALL"

# 启动应用
echo "🚀 启动应用..."
electron .
`

fs.writeFileSync('scripts/debug-electron.sh', debugScript)
fs.chmodSync('scripts/debug-electron.sh', '755')
console.log('  ✅ 已创建 scripts/debug-electron.sh')

// 3. 创建Windows调试脚本
const debugBat = `@echo off
echo 🔧 启动Electron调试模式...

REM 设置环境变量
set NODE_ENV=development
set ELECTRON_DEBUG=true
set LANG=zh_CN.UTF-8
set LC_ALL=zh_CN.UTF-8

REM 显示环境信息
echo 📊 环境变量:
echo   NODE_ENV: %NODE_ENV%
echo   ELECTRON_DEBUG: %ELECTRON_DEBUG%
echo   LANG: %LANG%
echo   LC_ALL: %LC_ALL%

REM 启动应用
echo 🚀 启动应用...
electron .
`

fs.writeFileSync('scripts/debug-electron.bat', debugBat)
console.log('  ✅ 已创建 scripts/debug-electron.bat')

console.log('\n🚀 使用修复后的应用:')
console.log('  macOS/Linux: ./scripts/debug-electron.sh')
console.log('  Windows: scripts/debug-electron.bat')
console.log('  或者: npm run electron:debug')

console.log('\n📊 检查清单:')
console.log('  1. ✅ HTML文件使用UTF-8 BOM编码')
console.log('  2. ✅ 设置正确的环境变量')
console.log('  3. ✅ 启用Electron调试模式')
console.log('  4. ⏳ 检查控制台输出是否显示正确编码')

console.log('\n💡 如果问题仍然存在:')
console.log('  1. 检查系统字体是否支持中文显示')
console.log('  2. 尝试重新构建: npm run build && npm run build:electron')
console.log('  3. 检查Electron版本兼容性')
console.log('  4. 查看控制台详细错误信息') 