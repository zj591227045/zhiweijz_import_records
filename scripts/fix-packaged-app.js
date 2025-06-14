#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 修复打包后应用的路径问题...')

const distElectronDir = path.join(__dirname, '../dist-electron')

// 检查是否有asar工具
function checkAsarTool() {
  try {
    execSync('which asar', { stdio: 'pipe' })
    return true
  } catch {
    try {
      execSync('npx asar --version', { stdio: 'pipe' })
      return true
    } catch {
      console.log('📦 安装asar工具...')
      try {
        execSync('npm install -g asar', { stdio: 'inherit' })
        return true
      } catch {
        console.error('❌ 无法安装asar工具，请手动安装: npm install -g asar')
        return false
      }
    }
  }
}

// 修复asar文件中的路径
function fixAsarPaths(asarPath) {
  const tempDir = path.join(path.dirname(asarPath), 'temp-asar-extract')
  const backupPath = asarPath + '.backup'
  
  try {
    // 备份原文件
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(asarPath, backupPath)
      console.log(`📋 已备份: ${path.basename(asarPath)}`)
    }
    
    // 解压asar
    console.log(`📦 解压: ${path.basename(asarPath)}`)
    execSync(`npx asar extract "${asarPath}" "${tempDir}"`, { stdio: 'pipe' })
    
    // 修复路径
    const distPath = path.join(tempDir, 'dist')
    if (fs.existsSync(distPath)) {
      // 修复HTML文件
      const indexPath = path.join(distPath, 'index.html')
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8')
        const originalContent = content
        content = content.replace(/src="\.\/assets\//g, 'src="assets/')
        content = content.replace(/href="\.\/assets\//g, 'href="assets/')
        content = content.replace(/href="\.\/favicon\.ico"/g, 'href="favicon.ico"')
        
        if (content !== originalContent) {
          fs.writeFileSync(indexPath, content)
          console.log('✅ 修复HTML路径')
        } else {
          console.log('⚠️ HTML文件无需修复或已修复')
        }
      }
      
      // 修复JS文件中的动态导入
      const assetsPath = path.join(distPath, 'assets')
      if (fs.existsSync(assetsPath)) {
        const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'))
        let fixedCount = 0
        
        jsFiles.forEach(filename => {
          const filePath = path.join(assetsPath, filename)
          let content = fs.readFileSync(filePath, 'utf8')
          const originalContent = content
          
          // 修复动态导入路径
          content = content.replace(/"\.\/assets\//g, '"./')
          
          if (content !== originalContent) {
            fs.writeFileSync(filePath, content)
            fixedCount++
          }
        })
        
        console.log(`✅ 修复了 ${fixedCount} 个JS文件的动态导入路径`)
      }
    }
    
    // 重新打包asar
    console.log(`📦 重新打包: ${path.basename(asarPath)}`)
    execSync(`npx asar pack "${tempDir}" "${asarPath}"`, { stdio: 'pipe' })
    
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true })
    
    console.log(`✅ 修复完成: ${path.basename(asarPath)}`)
    return true
    
  } catch (error) {
    console.error(`❌ 修复失败: ${path.basename(asarPath)}`, error.message)
    
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    
    // 恢复备份
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, asarPath)
      console.log(`🔄 已恢复备份: ${path.basename(asarPath)}`)
    }
    
    return false
  }
}

// 查找所有需要修复的asar文件
function findAsarFiles() {
  const asarFiles = []
  
  // macOS应用
  const macDirs = ['mac', 'mac-arm64']
  macDirs.forEach(dir => {
    const macPath = path.join(distElectronDir, dir)
    if (fs.existsSync(macPath)) {
      const appDirs = fs.readdirSync(macPath).filter(name => name.endsWith('.app'))
      appDirs.forEach(appDir => {
        const asarPath = path.join(macPath, appDir, 'Contents', 'Resources', 'app.asar')
        if (fs.existsSync(asarPath)) {
          asarFiles.push({
            path: asarPath,
            platform: 'macOS',
            arch: dir.includes('arm64') ? 'Apple Silicon' : 'Intel'
          })
        }
      })
    }
  })
  
  // Windows应用
  const winDirs = ['win-unpacked', 'win-ia32-unpacked']
  winDirs.forEach(dir => {
    const winPath = path.join(distElectronDir, dir)
    if (fs.existsSync(winPath)) {
      const asarPath = path.join(winPath, 'resources', 'app.asar')
      if (fs.existsSync(asarPath)) {
        asarFiles.push({
          path: asarPath,
          platform: 'Windows',
          arch: dir.includes('ia32') ? 'x86' : 'x64'
        })
      }
    }
  })
  
  return asarFiles
}

// 主函数
async function main() {
  try {
    // 检查asar工具
    if (!checkAsarTool()) {
      process.exit(1)
    }
    
    // 查找asar文件
    const asarFiles = findAsarFiles()
    
    if (asarFiles.length === 0) {
      console.log('⚠️ 未找到需要修复的asar文件')
      console.log('请先运行: npm run build:all')
      process.exit(1)
    }
    
    console.log(`📋 找到 ${asarFiles.length} 个asar文件需要修复:`)
    asarFiles.forEach(file => {
      console.log(`  - ${file.platform} ${file.arch}: ${path.basename(file.path)}`)
    })
    
    console.log('')
    
    // 修复每个asar文件
    let successCount = 0
    for (const file of asarFiles) {
      console.log(`🔧 修复 ${file.platform} ${file.arch} 版本...`)
      if (fixAsarPaths(file.path)) {
        successCount++
      }
      console.log('')
    }
    
    console.log(`🎉 修复完成! 成功修复 ${successCount}/${asarFiles.length} 个应用`)
    
    if (successCount === asarFiles.length) {
      console.log('✅ 所有应用已修复，现在可以正常运行了！')
      
      // 重新构建安装包
      console.log('')
      console.log('🔄 重新构建安装包...')
      try {
        execSync('npm run build:all', { stdio: 'inherit' })
        console.log('✅ 安装包重新构建完成')
      } catch (error) {
        console.log('⚠️ 安装包重新构建失败，但应用文件已修复')
      }
    } else {
      console.log('⚠️ 部分应用修复失败，请检查错误信息')
    }
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fixAsarPaths, findAsarFiles } 