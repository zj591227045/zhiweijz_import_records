#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 修复动态导入路径问题...')

function fixJavaScriptPaths() {
  const assetsDir = path.join(__dirname, '../dist/assets')
  
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ assets目录不存在')
    return false
  }
  
  const files = fs.readdirSync(assetsDir)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  
  console.log(`📂 找到 ${jsFiles.length} 个JS文件`)
  
  let fixedCount = 0
  
  jsFiles.forEach(filename => {
    const filePath = path.join(assetsDir, filename)
    let content = fs.readFileSync(filePath, 'utf8')
    
    // 修复动态导入路径：./assets/ -> ./
    const originalContent = content
    content = content.replace(/"\.\/assets\//g, '"./')
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ 已修复: ${filename}`)
      fixedCount++
    } else {
      console.log(`⏭️ 跳过: ${filename} (无需修复)`)
    }
  })
  
  console.log(`🎉 共修复了 ${fixedCount} 个文件`)
  return fixedCount > 0
}

function validatePaths() {
  const indexJsPath = path.join(__dirname, '../dist/assets')
  const files = fs.readdirSync(indexJsPath)
  const mainJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'))
  
  if (!mainJs) {
    console.error('❌ 未找到主JS文件')
    return false
  }
  
  const content = fs.readFileSync(path.join(indexJsPath, mainJs), 'utf8')
  
  // 检查是否还有重复的assets路径
  const badPaths = content.match(/"\.\/assets\//g)
  if (badPaths) {
    console.log(`⚠️ 仍有 ${badPaths.length} 个问题路径`)
    return false
  }
  
  // 检查正确的路径
  const goodPaths = content.match(/"\.\//g)
  if (goodPaths) {
    console.log(`✅ 找到 ${goodPaths.length} 个正确路径`)
  }
  
  return true
}

async function main() {
  try {
    console.log('🚀 开始修复动态导入路径...')
    
    if (fixJavaScriptPaths()) {
      console.log('✅ 路径修复完成')
    } else {
      console.log('ℹ️ 无需修复')
    }
    
    if (validatePaths()) {
      console.log('✅ 路径验证通过')
    } else {
      console.log('⚠️ 路径验证失败，可能需要手动检查')
    }
    
    console.log('')
    console.log('现在可以运行:')
    console.log('  npm run electron:debug  # 测试修复效果')
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fixJavaScriptPaths, validatePaths } 