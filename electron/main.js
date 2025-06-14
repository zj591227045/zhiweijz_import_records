const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// 强制设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.LANG = 'zh_CN.UTF-8'
process.env.LC_ALL = 'zh_CN.UTF-8'
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const isDev = process.env.NODE_ENV === 'development' && process.env.FORCE_PROD !== 'true'
const isDebug = process.env.ELECTRON_DEBUG === 'true' || process.env.NODE_ENV === 'development'

let mainWindow

console.log('🚀 Electron主进程启动...')
console.log('📊 环境信息:')
console.log('  - NODE_ENV:', process.env.NODE_ENV)
console.log('  - FORCE_PROD:', process.env.FORCE_PROD)
console.log('  - isDev:', isDev)
console.log('  - isDebug:', isDebug)
console.log('  - platform:', process.platform)
console.log('  - arch:', process.arch)
console.log('  - electron版本:', process.versions.electron)
console.log('  - node版本:', process.versions.node)
console.log('  - 工作目录:', process.cwd())
console.log('  - __dirname:', __dirname)

function createWindow() {
  console.log('🔧 创建主窗口...')
  
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: '记账数据导入工具',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      defaultEncoding: 'UTF-8',
      experimentalFeatures: true
    }
  }

  // 检查图标文件
  const iconPath = path.join(__dirname, '../assets/icon.png')
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath
    console.log('✅ 找到应用图标:', iconPath)
  } else {
    console.log('⚠️ 未找到应用图标:', iconPath)
  }

  mainWindow = new BrowserWindow(windowOptions)

  // 构建加载URL - 优先使用构建后的文件
  let startUrl
  const indexPath = path.join(__dirname, '../dist/index.html')
  
  if (isDev && fs.existsSync('http://localhost:5173')) {
    // 只有在开发服务器真正运行时才使用
    startUrl = 'http://localhost:5173'
    console.log('🌐 使用开发服务器')
  } else {
    // 使用构建后的文件
    if (fs.existsSync(indexPath)) {
      const normalizedPath = indexPath.replace(/\\/g, '/')
      startUrl = `file://${normalizedPath}`
      console.log('📁 使用构建文件')
    } else {
      console.error('❌ 构建文件不存在，请先运行 npm run build')
      dialog.showErrorBox('错误', '构建文件不存在，请先运行 npm run build')
      app.quit()
      return
    }
  }
  
  console.log('🌐 准备加载URL:', startUrl)

  // 验证文件是否存在
  if (startUrl.startsWith('file://')) {
    const assetsPath = path.join(__dirname, '../dist/assets')
    
    console.log('📁 检查索引文件:', indexPath)
    if (fs.existsSync(indexPath)) {
      console.log('✅ 索引文件存在')
      const content = fs.readFileSync(indexPath, 'utf8')
      console.log('📄 文件大小:', content.length, 'bytes')
      console.log('🔍 文件开头:', content.substring(0, 200))
      
      // 检查HTML中的资源引用
      const jsMatch = content.match(/src="assets\/([^"]+)"/);
      const cssMatch = content.match(/href="assets\/([^"]+)"/);
      
      if (jsMatch) {
        const jsFile = path.join(assetsPath, jsMatch[1])
        console.log('🔍 检查JS文件:', jsFile, fs.existsSync(jsFile) ? '✅存在' : '❌不存在')
      }
      if (cssMatch) {
        const cssFile = path.join(assetsPath, cssMatch[1])
        console.log('🔍 检查CSS文件:', cssFile, fs.existsSync(cssFile) ? '✅存在' : '❌不存在')
      }
    } else {
      console.error('❌ 索引文件不存在!')
      return
    }
    
    console.log('📁 检查assets目录:', assetsPath)
    if (fs.existsSync(assetsPath)) {
      console.log('✅ assets目录存在')
      const files = fs.readdirSync(assetsPath)
      console.log('📂 assets文件列表:', files.slice(0, 5), files.length > 5 ? `... 共${files.length}个文件` : '')
    } else {
      console.error('❌ assets目录不存在!')
    }
  }

  // 设置协议处理器来处理file://协议
  if (startUrl.startsWith('file://')) {
    mainWindow.webContents.session.protocol.registerFileProtocol('file', (request, callback) => {
      const url = request.url.substr(7) // 移除 'file://' 前缀
      const decodedPath = decodeURIComponent(url)
      console.log('🔗 协议处理:', request.url, '->', decodedPath)
      callback(decodedPath)
    })
  }

  // 设置用户代理
  const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Electron/${process.versions.electron}`
  mainWindow.webContents.setUserAgent(userAgent)

  // 页面加载事件监听
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    console.log('🧭 页面导航:', navigationUrl)
  })

  mainWindow.webContents.on('did-start-loading', () => {
    console.log('⏳ 开始加载页面...')
  })

  mainWindow.webContents.on('did-stop-loading', () => {
    console.log('⏹️ 页面加载停止')
  })

  mainWindow.webContents.on('dom-ready', () => {
    console.log('🎯 DOM准备就绪')
    
    // 注入调试代码
    const debugScript = `
      console.log('=== Electron渲染进程调试信息 ===');
      console.log('📍 当前URL:', window.location.href);
      console.log('📄 文档编码:', document.characterSet);
      console.log('🌐 页面语言:', document.documentElement.lang);
      console.log('🔍 用户代理:', navigator.userAgent);
      console.log('🖥️ 平台:', navigator.platform);
      console.log('📱 语言:', navigator.language);
      
      // 检查process对象
      if (typeof process !== 'undefined') {
        console.log('✅ process对象可用:', process.type);
      } else {
        console.log('❌ process对象不可用，注入中...');
        window.process = {
          type: 'renderer',
          platform: '${process.platform}',
          versions: { electron: '${process.versions.electron}' }
        };
      }
      
      // 设置Electron标识
      window.isElectron = true;
      
      // 监听资源加载错误
      const originalError = console.error;
      console.error = function(...args) {
        if (args[0] && args[0].toString().includes('ERR_FILE_NOT_FOUND')) {
          console.log('🚨 文件未找到错误:', args);
        }
        originalError.apply(console, args);
      };
      
      // 检查所有script标签的加载状态
      document.querySelectorAll('script').forEach((script, index) => {
        console.log(\`📜 Script \${index + 1}: \${script.src || 'inline'}\`);
        if (script.src) {
          script.onerror = (e) => {
            console.error('❌ Script加载失败:', script.src, e);
            document.body.innerHTML += '<div style="color:red;padding:20px;">Script加载失败: ' + script.src + '</div>';
          };
          script.onload = () => console.log('✅ Script加载成功:', script.src);
        }
      });
      
      // 检查所有link标签的加载状态
      document.querySelectorAll('link[rel="stylesheet"]').forEach((link, index) => {
        console.log(\`🎨 CSS \${index + 1}: \${link.href}\`);
        link.onerror = (e) => {
          console.error('❌ CSS加载失败:', link.href, e);
          document.body.innerHTML += '<div style="color:red;padding:20px;">CSS加载失败: ' + link.href + '</div>';
        };
        link.onload = () => console.log('✅ CSS加载成功:', link.href);
      });
      
      // 检查app挂载点
      setTimeout(() => {
        const appDiv = document.getElementById('app');
        if (appDiv) {
          console.log('✅ 找到app挂载点');
          console.log('📏 内容长度:', appDiv.innerHTML.length);
          if (appDiv.innerHTML.length === 0) {
            console.error('❌ Vue应用可能未正常挂载');
            appDiv.innerHTML = '<div style="padding:20px;color:orange;">Vue应用正在加载中...</div>';
            
            // 尝试检查是否有错误
            if (window.Vue) {
              console.log('✅ Vue已加载');
            } else {
              console.error('❌ Vue未加载');
            }
          } else {
            console.log('✅ Vue应用已挂载');
          }
        } else {
          console.error('❌ 未找到app挂载点');
          document.body.innerHTML += '<div style="color:red;padding:20px;">未找到app挂载点</div>';
        }
      }, 3000);
      
      // 监听所有错误
      window.addEventListener('error', (e) => {
        console.error('🚨 页面错误:', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          error: e.error
        });
        document.body.innerHTML += '<div style="color:red;padding:10px;border:1px solid red;margin:10px;">错误: ' + e.message + '</div>';
      });
      
      window.addEventListener('unhandledrejection', (e) => {
        console.error('🚨 Promise错误:', e.reason);
        document.body.innerHTML += '<div style="color:red;padding:10px;border:1px solid red;margin:10px;">Promise错误: ' + e.reason + '</div>';
      });
    `
    
    mainWindow.webContents.executeJavaScript(debugScript)
      .catch(err => console.error('❌ 调试脚本执行失败:', err))
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ 页面加载完成')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ 页面加载失败:')
    console.error('  - 错误代码:', errorCode)
    console.error('  - 错误描述:', errorDescription)
    console.error('  - URL:', validatedURL)
    
    // 如果是开发模式失败，尝试使用构建文件
    if (validatedURL.includes('localhost') && !startUrl.startsWith('file://')) {
      console.log('🔄 开发服务器连接失败，尝试使用构建文件...')
      const fallbackPath = path.join(__dirname, '../dist/index.html')
      if (fs.existsSync(fallbackPath)) {
        const fallbackUrl = `file://${fallbackPath.replace(/\\/g, '/')}`
        console.log('🔄 重新加载:', fallbackUrl)
        mainWindow.loadURL(fallbackUrl)
      }
    }
  })

  // 监听控制台消息
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['LOG', 'WARN', 'ERROR']
    const prefix = `[渲染进程-${levels[level] || level}]`
    console.log(`${prefix} ${message}`)
    if (line && sourceId) {
      console.log(`  📍 ${sourceId}:${line}`)
    }
  })

  // 监听页面崩溃
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('💥 渲染进程崩溃:', details)
  })

  // 窗口事件
  mainWindow.once('ready-to-show', () => {
    console.log('👁️ 窗口准备显示')
    mainWindow.show()
    
    if (isDebug) {
      console.log('🔍 打开开发者工具')
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('closed', () => {
    console.log('🔒 窗口已关闭')
    mainWindow = null
  })

  // 加载页面
  console.log('🔄 开始加载页面:', startUrl)
  mainWindow.loadURL(startUrl)
    .then(() => {
      console.log('✅ loadURL 成功')
    })
    .catch(err => {
      console.error('❌ loadURL 失败:', err)
    })

  // 创建菜单
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: '记账数据导入工具',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '记账数据导入工具',
              detail: '版本 1.0.0\n\n专业的记账数据导入工具\n支持Excel和CSV文件导入\n智能分类映射和数据处理'
            })
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
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
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 应用事件
app.whenReady().then(() => {
  console.log('🎉 Electron应用准备就绪')
  createWindow()
})

app.on('window-all-closed', () => {
  console.log('🚪 所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  console.log('🔄 应用激活')
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 防止多实例
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log('🚫 应用已运行，退出新实例')
  app.quit()
} else {
  app.on('second-instance', () => {
    console.log('👥 检测到第二个实例，聚焦到主窗口')
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
} 