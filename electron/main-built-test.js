const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    show: false
  })

  // 加载测试页面
  const testPagePath = path.join(__dirname, '../test-built-app.html')
  console.log('Loading test page:', testPagePath)
  
  mainWindow.loadFile(testPagePath)
  
  // 打开开发者工具
  mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Test page loaded successfully')
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}) 