#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 修复Electron路径和中文编码问题...')

// 修复dist/index.html中的资源路径
function fixHtmlPaths() {
  const htmlPath = path.join(__dirname, '../dist/index.html')
  
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ index.html 文件不存在:', htmlPath)
    return false
  }

  let content = fs.readFileSync(htmlPath, 'utf8')
  
  // 确保使用正确的相对路径
  content = content.replace(/src="\.\/assets\//g, 'src="assets/')
  content = content.replace(/href="\.\/assets\//g, 'href="assets/')
  content = content.replace(/href="\.\/favicon\.ico"/g, 'href="favicon.ico"')
  
  // 添加base标签确保路径解析正确
  if (!content.includes('<base')) {
    const headTag = content.indexOf('</head>')
    if (headTag !== -1) {
      const baseTag = '  <base href="./">\n'
      content = content.slice(0, headTag) + baseTag + content.slice(headTag)
    }
  }
  
  // 确保字符集设置正确
  if (!content.includes('http-equiv="Content-Type"')) {
    const charsetLine = content.indexOf('<meta charset="UTF-8">')
    if (charsetLine !== -1) {
      const newCharsetLine = '    <meta charset="UTF-8">\n    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
      content = content.replace('<meta charset="UTF-8">', newCharsetLine)
    }
  }
  
  fs.writeFileSync(htmlPath, content, 'utf8')
  console.log('✅ 已修复 index.html 路径')
  return true
}

// 检查assets目录和文件
function checkAssets() {
  const assetsPath = path.join(__dirname, '../dist/assets')
  
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ assets 目录不存在:', assetsPath)
    return false
  }
  
  const files = fs.readdirSync(assetsPath)
  console.log('📂 assets 文件列表:')
  files.forEach(file => {
    const filePath = path.join(assetsPath, file)
    const stats = fs.statSync(filePath)
    console.log(`  - ${file} (${(stats.size / 1024).toFixed(1)}KB)`)
  })
  
  return true
}

// 验证HTML文件内容
function validateHtml() {
  const htmlPath = path.join(__dirname, '../dist/index.html')
  const content = fs.readFileSync(htmlPath, 'utf8')
  
  console.log('🔍 验证 HTML 文件:')
  console.log('  文件大小:', content.length, 'bytes')
  
  // 检查资源引用
  const jsMatches = content.match(/src="[^"]*\.js"/g) || []
  const cssMatches = content.match(/href="[^"]*\.css"/g) || []
  
  console.log('  JS 文件引用:', jsMatches.length)
  jsMatches.forEach(match => console.log('    -', match))
  
  console.log('  CSS 文件引用:', cssMatches.length)
  cssMatches.forEach(match => console.log('    -', match))
  
  // 检查实际文件是否存在
  const assetsPath = path.join(__dirname, '../dist/assets')
  jsMatches.forEach(match => {
    const filename = match.match(/src="(?:\.\/)?assets\/([^"]+)"/)?.[1]
    if (filename) {
      const filePath = path.join(assetsPath, filename)
      const exists = fs.existsSync(filePath)
      console.log(`    ${exists ? '✅' : '❌'} ${filename}`)
    }
  })
  
  cssMatches.forEach(match => {
    const filename = match.match(/href="(?:\.\/)?assets\/([^"]+)"/)?.[1]
    if (filename) {
      const filePath = path.join(assetsPath, filename)
      const exists = fs.existsSync(filePath)
      console.log(`    ${exists ? '✅' : '❌'} ${filename}`)
    }
  })
}

// 创建test.html用于调试
function createTestHtml() {
  const testPath = path.join(__dirname, '../dist/test.html')
  const assetsPath = path.join(__dirname, '../dist/assets')
  
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ assets 目录不存在')
    return
  }
  
  const files = fs.readdirSync(assetsPath)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const cssFiles = files.filter(f => f.endsWith('.css'))
  
  const mainJs = jsFiles.find(f => f.includes('index-')) || jsFiles[0]
  const mainCss = cssFiles.find(f => f.includes('index-')) || cssFiles[0]
  
  const testContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <base href="./">
  <title>测试页面</title>
  ${mainCss ? `<link rel="stylesheet" href="assets/${mainCss}">` : ''}
</head>
<body>
  <div id="app">
    <h1>测试页面</h1>
    <p>如果您能看到这个页面，说明HTML加载正常</p>
    <div id="status">等待JavaScript加载...</div>
  </div>
  
  <script>
    console.log('测试页面已加载');
    document.getElementById('status').textContent = 'HTML和基础CSS已加载';
    
    // 监听错误
    window.addEventListener('error', (e) => {
      console.error('错误:', e);
      document.getElementById('status').textContent = '发生错误: ' + e.message;
    });
  </script>
  
  ${mainJs ? `<script type="module" src="assets/${mainJs}"></script>` : ''}
</body>
</html>`
  
  fs.writeFileSync(testPath, testContent, 'utf8')
  console.log('✅ 已创建测试文件:', testPath)
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始修复...')
    
    if (!fixHtmlPaths()) {
      console.error('❌ 修复HTML路径失败')
      process.exit(1)
    }
    
    if (!checkAssets()) {
      console.error('❌ 检查assets失败')
      process.exit(1)
    }
    
    validateHtml()
    createTestHtml()
    
    console.log('✅ 修复完成!')
    console.log('')
    console.log('现在可以运行:')
    console.log('  npm run electron:debug  # 调试模式')
    console.log('  npm run build:electron  # 构建应用')
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fixHtmlPaths, checkAssets, validateHtml, createTestHtml } 