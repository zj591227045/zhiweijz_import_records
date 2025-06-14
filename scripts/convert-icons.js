#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

async function convertIcons() {
  const assetsDir = path.join(__dirname, '../assets')
  
  try {
    // 检查是否安装了sharp
    let sharp
    try {
      sharp = require('sharp')
    } catch (error) {
      console.log('📦 安装 sharp...')
      require('child_process').execSync('npm install --save-dev sharp', { stdio: 'inherit' })
      sharp = require('sharp')
    }

    console.log('🎨 转换应用图标...')
    
    const svgPath = path.join(assetsDir, 'icon.svg')
    
    if (!fs.existsSync(svgPath)) {
      throw new Error('SVG图标文件不存在')
    }
    
    // 生成PNG图标（多种尺寸）
    const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
    for (const size of sizes) {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(path.join(assetsDir, `icon-${size}.png`))
    }
    
    // 生成主图标
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'))
    
    console.log('✅ 图标转换完成！')
    console.log('💡 提示：')
    console.log('   - PNG图标已生成完成')
    console.log('   - 请手动创建 icon.icns (macOS) 和 icon.ico (Windows)')
    console.log('   - 可以使用在线工具或专业软件进行转换')
    console.log('   - 或者安装 electron-icon-builder: npm install -g electron-icon-builder')
    
  } catch (error) {
    console.error('❌ 图标转换失败:', error.message)
    console.log('💡 请手动创建以下图标文件：')
    console.log('   - assets/icon.png (512x512)')
    console.log('   - assets/icon.icns (macOS)')
    console.log('   - assets/icon.ico (Windows)')
    console.log('📝 使用现有的SVG图标文件创建这些格式')
  }
}

convertIcons() 