#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🖥️ 开始构建桌面应用...')

try {
  // 1. 检查是否安装了electron-builder
  try {
    require('electron-builder')
  } catch (error) {
    console.log('📦 安装 electron-builder...')
    execSync('npm install --save-dev electron-builder', { stdio: 'inherit' })
  }

  // 2. 检查是否安装了electron
  try {
    require('electron')
  } catch (error) {
    console.log('📦 安装 electron...')
    execSync('npm install --save-dev electron', { stdio: 'inherit' })
  }

  // 3. 构建Web应用
  console.log('🌐 构建Web应用...')
  execSync('npm run build', { stdio: 'inherit' })

  // 4. 创建Electron主进程文件
  console.log('⚡ 创建Electron主进程...')
  const electronMain = `const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// 保持对窗口对象的全局引用
let mainWindow

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  })

  // 加载应用
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : \`file://\${path.join(__dirname, '../dist/index.html')}\`
  
  mainWindow.loadURL(startUrl)

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // 开发模式下打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // 当窗口被关闭时
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 创建菜单
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: '只为记账-导入助手',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '只为记账-导入助手',
              detail: '版本 1.0.0\\n\\n专业的记账数据导入工具\\n支持Excel和CSV文件导入\\n智能分类映射和数据处理'
            })
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用帮助',
          click: () => {
            shell.openExternal('https://github.com/your-repo/help')
          }
        },
        {
          label: '反馈问题',
          click: () => {
            shell.openExternal('https://github.com/your-repo/issues')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow)

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用和菜单栏通常会保持活动状态，直到用户明确退出
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常会重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 在这个文件中，你可以包含应用程序的其余特定主进程代码
// 你也可以将它们放在单独的文件中并在这里引入
`

  fs.writeFileSync(path.join(__dirname, '../electron-main.js'), electronMain)

  // 5. 创建应用图标目录
  const assetsDir = path.join(__dirname, '../assets')
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true })
  }

  // 6. 创建简单的应用图标（SVG格式，可以转换为其他格式）
  console.log('🎨 创建应用图标...')
  const iconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="256" cy="256" r="240" fill="url(#grad1)" stroke="#ffffff" stroke-width="8"/>
  
  <!-- 文档图标 -->
  <rect x="160" y="120" width="160" height="200" rx="8" fill="#ffffff" opacity="0.9"/>
  <rect x="160" y="120" width="160" height="40" rx="8" fill="#ffffff"/>
  
  <!-- 表格线条 -->
  <line x1="180" y1="180" x2="300" y2="180" stroke="#4F46E5" stroke-width="3"/>
  <line x1="180" y1="200" x2="300" y2="200" stroke="#4F46E5" stroke-width="3"/>
  <line x1="180" y1="220" x2="300" y2="220" stroke="#4F46E5" stroke-width="3"/>
  <line x1="180" y1="240" x2="300" y2="240" stroke="#4F46E5" stroke-width="3"/>
  
  <!-- 导入箭头 -->
  <path d="M 340 200 L 380 200 L 370 190 M 380 200 L 370 210" stroke="#10B981" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="400" cy="200" r="20" fill="#10B981"/>
  <path d="M 390 200 L 400 190 L 410 200 L 400 210 Z" fill="#ffffff"/>
  
  <!-- 标题文字 -->
  <text x="256" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">导入</text>
  <text x="256" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.9">助手</text>
</svg>`

  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg)

  // 7. 更新package.json添加Electron配置
  console.log('📝 更新package.json...')
  const packageJsonPath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // 添加Electron相关配置
  packageJson.main = 'electron-main.js'
  packageJson.homepage = './'
  
  // 添加构建脚本
  packageJson.scripts = {
    ...packageJson.scripts,
    'electron': 'electron .',
    'electron:dev': 'NODE_ENV=development electron .',
    'build:desktop': 'npm run build && electron-builder',
    'build:desktop:mac': 'npm run build && electron-builder --mac',
    'build:desktop:win': 'npm run build && electron-builder --win',
    'build:desktop:linux': 'npm run build && electron-builder --linux'
  }

  // 添加Electron Builder配置
  packageJson.build = {
    appId: 'com.zhiwei.import-assistant',
    productName: '只为记账-导入助手',
    directories: {
      output: 'desktop-dist'
    },
    files: [
      'dist/**/*',
      'electron-main.js',
      'assets/**/*',
      'node_modules/**/*',
      'package.json'
    ],
    mac: {
      icon: 'assets/icon.icns',
      category: 'public.app-category.finance',
      target: [
        {
          target: 'dmg',
          arch: ['x64', 'arm64']
        },
        {
          target: 'zip',
          arch: ['x64', 'arm64']
        }
      ]
    },
    win: {
      icon: 'assets/icon.ico',
      target: [
        {
          target: 'nsis',
          arch: ['x64', 'ia32']
        },
        {
          target: 'portable',
          arch: ['x64', 'ia32']
        }
      ]
    },
    linux: {
      icon: 'assets/icon.png',
      category: 'Office',
      target: [
        {
          target: 'AppImage',
          arch: ['x64']
        },
        {
          target: 'deb',
          arch: ['x64']
        }
      ]
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true
    }
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  // 8. 创建图标转换脚本
  console.log('🔄 创建图标转换脚本...')
  const iconScript = `#!/usr/bin/env node

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

async function convertIcons() {
  const svgPath = path.join(__dirname, '../assets/icon.svg')
  const assetsDir = path.join(__dirname, '../assets')
  
  try {
    // 检查是否安装了sharp
    try {
      require('sharp')
    } catch (error) {
      console.log('📦 安装 sharp...')
      require('child_process').execSync('npm install --save-dev sharp', { stdio: 'inherit' })
    }

    console.log('🎨 转换应用图标...')
    
    // 生成PNG图标（多种尺寸）
    const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
    for (const size of sizes) {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(path.join(assetsDir, \`icon-\${size}.png\`))
    }
    
    // 生成主图标
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'))
    
    console.log('✅ 图标转换完成！')
    console.log('💡 提示：')
    console.log('   - 请手动创建 icon.icns (macOS) 和 icon.ico (Windows)')
    console.log('   - 可以使用在线工具或专业软件进行转换')
    console.log('   - 或者安装 electron-icon-builder: npm install -g electron-icon-builder')
    
  } catch (error) {
    console.error('❌ 图标转换失败:', error.message)
    console.log('💡 请手动创建以下图标文件：')
    console.log('   - assets/icon.png (512x512)')
    console.log('   - assets/icon.icns (macOS)')
    console.log('   - assets/icon.ico (Windows)')
  }
}

convertIcons()
`

  fs.writeFileSync(path.join(__dirname, 'convert-icons.js'), iconScript)

  // 9. 创建构建脚本
  const buildScript = `#!/bin/bash

echo "🖥️ 构建桌面应用..."

# 转换图标
echo "🎨 转换图标..."
node scripts/convert-icons.js

# 检测操作系统并构建对应平台
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 检测到 macOS，构建 macOS 应用..."
    npm run build:desktop:mac
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 检测到 Windows，构建 Windows 应用..."
    npm run build:desktop:win
else
    echo "🐧 检测到 Linux，构建 Linux 应用..."
    npm run build:desktop:linux
fi

echo "✅ 桌面应用构建完成！"
echo "📁 输出目录: desktop-dist/"
`

  fs.writeFileSync(path.join(__dirname, 'build-desktop.sh'), buildScript)
  execSync(`chmod +x "${path.join(__dirname, 'build-desktop.sh')}"`)

  // Windows构建脚本
  const buildBat = `@echo off
echo 🖥️ 构建桌面应用...

REM 转换图标
echo 🎨 转换图标...
node scripts/convert-icons.js

REM 构建Windows应用
echo 🪟 构建 Windows 应用...
npm run build:desktop:win

echo ✅ 桌面应用构建完成！
echo 📁 输出目录: desktop-dist/
pause
`

  fs.writeFileSync(path.join(__dirname, 'build-desktop.bat'), buildBat)

  console.log('✅ 桌面应用配置完成！')
  console.log('🚀 构建方式:')
  console.log('   - 自动检测平台: ./scripts/build-desktop.sh 或 scripts/build-desktop.bat')
  console.log('   - macOS: npm run build:desktop:mac')
  console.log('   - Windows: npm run build:desktop:win')
  console.log('   - Linux: npm run build:desktop:linux')
  console.log('   - 所有平台: npm run build:desktop')
  console.log('')
  console.log('📝 下一步:')
  console.log('   1. 运行图标转换: node scripts/convert-icons.js')
  console.log('   2. 构建应用: npm run build:desktop')

} catch (error) {
  console.error('❌ 配置失败:', error.message)
  process.exit(1)
} 