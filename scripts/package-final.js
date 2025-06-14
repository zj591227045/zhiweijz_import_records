#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🎁 开始最终打包...')

const releaseDir = path.join(__dirname, '../release')
const distElectronDir = path.join(__dirname, '../dist-electron')
const distStaticDir = path.join(__dirname, '../dist-static')

// 清理并创建发布目录
if (fs.existsSync(releaseDir)) {
  console.log('🧹 清理旧的发布目录...')
  fs.rmSync(releaseDir, { recursive: true, force: true })
}

fs.mkdirSync(releaseDir, { recursive: true })

// 创建子目录
const desktopDir = path.join(releaseDir, 'desktop')
const webDir = path.join(releaseDir, 'web')
const docsDir = path.join(releaseDir, 'docs')

fs.mkdirSync(desktopDir, { recursive: true })
fs.mkdirSync(webDir, { recursive: true })
fs.mkdirSync(docsDir, { recursive: true })

console.log('📁 创建发布目录结构完成')

// 1. 复制桌面应用文件
console.log('📱 整理桌面应用文件...')

const electronFiles = [
  '记账数据导入工具-0.0.0.dmg',           // macOS Intel
  '记账数据导入工具-0.0.0-arm64.dmg',     // macOS Apple Silicon
  '记账数据导入工具 Setup 0.0.0.exe',     // Windows 安装包
  '记账数据导入工具 0.0.0.exe'            // Windows 便携版
]

electronFiles.forEach(filename => {
  const srcPath = path.join(distElectronDir, filename)
  if (fs.existsSync(srcPath)) {
    const destPath = path.join(desktopDir, filename)
    fs.copyFileSync(srcPath, destPath)
    const stats = fs.statSync(destPath)
    console.log(`✅ ${filename} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`)
  } else {
    console.log(`⚠️ 未找到: ${filename}`)
  }
})

// 2. 复制Web应用文件
console.log('🌐 整理Web应用文件...')

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

if (fs.existsSync(distStaticDir)) {
  copyDir(distStaticDir, webDir)
  console.log('✅ Web应用文件复制完成')
} else {
  console.log('⚠️ 未找到Web应用构建文件，请先运行 node scripts/build-static.js')
}

// 3. 创建版本信息
const versionInfo = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version,
  description: '记账数据导入工具',
  features: [
    '支持Excel和CSV文件导入',
    '智能分类映射',
    '实时导入进度显示',
    '支持撤销导入操作',
    '跨平台桌面应用',
    'Web版本支持PM2部署'
  ],
  files: {
    desktop: electronFiles.filter(f => fs.existsSync(path.join(desktopDir, f))),
    web: 'dist-static目录包含完整的Web应用'
  }
}

fs.writeFileSync(
  path.join(releaseDir, 'version.json'),
  JSON.stringify(versionInfo, null, 2)
)

// 4. 创建安装说明
const installGuide = `# 记账数据导入工具 - 安装指南

## 版本信息
- 版本号: ${versionInfo.version}
- 构建时间: ${new Date().toLocaleString('zh-CN')}
- 支持平台: macOS, Windows, Web

## 桌面应用安装

### macOS
1. **Intel Mac**: 下载 \`记账数据导入工具-0.0.0.dmg\`
2. **Apple Silicon Mac**: 下载 \`记账数据导入工具-0.0.0-arm64.dmg\`
3. 双击DMG文件，将应用拖拽到Applications文件夹
4. 首次运行可能需要在系统偏好设置中允许运行

### Windows
1. **安装版**: 下载 \`记账数据导入工具 Setup 0.0.0.exe\`
   - 双击运行安装程序
   - 按照向导完成安装
   - 安装后可在开始菜单找到应用

2. **便携版**: 下载 \`记账数据导入工具 0.0.0.exe\`
   - 直接运行，无需安装
   - 可放在任意目录使用

## Web应用部署

### 快速部署
1. 解压 \`web\` 目录到服务器
2. 进入目录: \`cd web\`
3. 直接启动: \`./start.sh\`
4. 访问: http://localhost:3000

### 生产环境部署（推荐）
1. 解压 \`web\` 目录到服务器
2. 进入目录: \`cd web\`
3. 使用PM2启动: \`./start-pm2.sh\`
4. 配置反向代理（Nginx等）

### PM2管理命令
- 启动: \`npm run pm2:start\`
- 停止: \`npm run pm2:stop\`
- 重启: \`npm run pm2:restart\`
- 查看日志: \`npm run pm2:logs\`
- 监控状态: \`npm run pm2:monit\`

## 系统要求

### 桌面应用
- **macOS**: 10.12+ (Sierra或更高版本)
- **Windows**: Windows 7/8/10/11 (32位或64位)
- **内存**: 最少512MB，推荐1GB+
- **存储**: 200MB可用空间

### Web应用
- **Node.js**: 16.0.0或更高版本
- **内存**: 最少256MB，推荐512MB+
- **浏览器**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## 功能特性
- ✅ 支持Excel (.xlsx, .xls) 和CSV文件导入
- ✅ 智能分类映射和数据验证
- ✅ 实时导入进度显示
- ✅ 支持撤销导入操作
- ✅ 响应式设计，支持移动端
- ✅ 跨平台支持
- ✅ 支持服务器部署

## 技术支持
如遇到问题，请检查：
1. 系统是否满足最低要求
2. 文件格式是否正确
3. 网络连接是否正常

## 更新日志
### v1.0.0 (${new Date().toLocaleDateString('zh-CN')})
- 🎉 首次发布
- ✨ 完整的导入功能
- 🖥️ 桌面应用支持
- 🌐 Web应用支持
- 📱 响应式设计
`

fs.writeFileSync(path.join(docsDir, '安装指南.md'), installGuide)

// 5. 创建快速开始指南
const quickStart = `# 快速开始指南

## 1. 选择版本

### 桌面应用（推荐个人使用）
- 无需安装额外软件
- 离线使用
- 更好的性能

### Web应用（推荐团队使用）
- 支持多用户访问
- 便于部署和管理
- 支持远程访问

## 2. 使用流程

### 步骤1: 准备数据文件
- 支持格式: Excel (.xlsx, .xls), CSV
- 确保数据格式正确
- 建议先下载模板文件

### 步骤2: 配置服务器连接
- 输入服务器地址
- 填写登录凭据
- 测试连接状态

### 步骤3: 上传文件
- 选择要导入的文件
- 预览数据内容
- 确认数据格式

### 步骤4: 映射分类
- 设置分类映射规则
- 预览映射结果
- 调整映射配置

### 步骤5: 执行导入
- 开始导入过程
- 监控导入进度
- 查看导入结果

### 步骤6: 验证结果
- 检查导入的数据
- 如有问题可撤销导入
- 生成导入报告

## 3. 常见问题

### Q: 支持哪些文件格式？
A: 支持Excel (.xlsx, .xls) 和CSV格式文件

### Q: 文件大小有限制吗？
A: 建议单个文件不超过50MB，记录数不超过10万条

### Q: 可以批量导入吗？
A: 目前支持单文件导入，可以多次导入不同文件

### Q: 导入失败怎么办？
A: 检查文件格式、网络连接和服务器状态，可以撤销后重新导入

### Q: 如何撤销导入？
A: 在导入报告页面点击"撤销导入"按钮

## 4. 技巧和建议

- 📋 使用模板文件确保数据格式正确
- 🔍 导入前先预览数据
- 📊 合理设置分类映射
- 💾 定期备份重要数据
- 🔄 大文件建议分批导入
`

fs.writeFileSync(path.join(docsDir, '快速开始.md'), quickStart)

// 6. 创建发布说明
const releaseNotes = `# 记账数据导入工具 v1.0.0 发布说明

## 🎉 首次发布

我们很高兴地宣布记账数据导入工具 v1.0.0 正式发布！这是一个功能完整、跨平台的数据导入解决方案。

## ✨ 主要特性

### 🖥️ 桌面应用
- **跨平台支持**: macOS (Intel & Apple Silicon) 和 Windows
- **原生体验**: 使用Electron构建，提供原生应用体验
- **离线使用**: 无需网络连接即可使用基本功能
- **自动更新**: 支持应用自动更新（未来版本）

### 🌐 Web应用
- **服务器部署**: 支持独立服务器部署
- **PM2管理**: 内置PM2配置，便于生产环境管理
- **响应式设计**: 完美支持桌面和移动设备
- **多用户访问**: 支持团队协作使用

### 📊 数据导入
- **多格式支持**: Excel (.xlsx, .xls) 和 CSV 文件
- **智能映射**: 自动识别和映射数据字段
- **实时预览**: 导入前可预览数据内容
- **进度监控**: 实时显示导入进度和状态

### 🔧 高级功能
- **分类映射**: 灵活的分类映射配置
- **数据验证**: 自动验证数据格式和完整性
- **撤销导入**: 支持撤销错误的导入操作
- **导入报告**: 详细的导入结果报告

## 📦 发布包内容

### 桌面应用
- \`记账数据导入工具-0.0.0.dmg\` - macOS Intel版本 (124MB)
- \`记账数据导入工具-0.0.0-arm64.dmg\` - macOS Apple Silicon版本 (119MB)
- \`记账数据导入工具 Setup 0.0.0.exe\` - Windows安装版 (179MB)
- \`记账数据导入工具 0.0.0.exe\` - Windows便携版 (179MB)

### Web应用
- 完整的Web应用部署包
- PM2配置文件
- 启动脚本和文档

## 🔧 技术规格

### 桌面应用
- **框架**: Electron 36.4.0
- **前端**: Vue 3 + TypeScript + Vite
- **UI库**: Element Plus
- **状态管理**: Pinia

### Web应用
- **后端**: Express.js
- **进程管理**: PM2
- **部署**: 静态文件 + API代理

## 📋 系统要求

### 桌面应用
- **macOS**: 10.12 (Sierra) 或更高版本
- **Windows**: Windows 7/8/10/11
- **内存**: 最少512MB，推荐1GB+
- **存储**: 200MB可用空间

### Web应用
- **Node.js**: 16.0.0或更高版本
- **内存**: 最少256MB，推荐512MB+
- **浏览器**: 现代浏览器 (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)

## 🚀 快速开始

### 桌面应用
1. 下载对应平台的安装包
2. 安装或直接运行
3. 按照向导完成配置

### Web应用
1. 解压部署包到服务器
2. 运行 \`./start-pm2.sh\`
3. 访问 http://localhost:3000

## 🔮 未来计划

- 📱 移动应用版本
- 🔄 自动同步功能
- 📈 数据分析和报表
- 🌍 多语言支持
- 🔐 增强的安全功能

## 📞 技术支持

如果您在使用过程中遇到任何问题，请：
1. 查看安装指南和快速开始文档
2. 检查系统要求是否满足
3. 联系技术支持团队

感谢您使用记账数据导入工具！

---
发布时间: ${new Date().toLocaleString('zh-CN')}
版本: v1.0.0
`

fs.writeFileSync(path.join(docsDir, '发布说明.md'), releaseNotes)

// 7. 创建主README
const mainReadme = `# 记账数据导入工具 v1.0.0

一个功能强大、跨平台的记账数据导入解决方案，支持桌面应用和Web部署。

## 📁 目录结构

\`\`\`
release/
├── desktop/                    # 桌面应用
│   ├── 记账数据导入工具-0.0.0.dmg           # macOS Intel版
│   ├── 记账数据导入工具-0.0.0-arm64.dmg     # macOS Apple Silicon版
│   ├── 记账数据导入工具 Setup 0.0.0.exe     # Windows安装版
│   └── 记账数据导入工具 0.0.0.exe           # Windows便携版
├── web/                        # Web应用
│   ├── dist/                   # 前端构建文件
│   ├── server.js               # HTTP服务器
│   ├── ecosystem.config.js     # PM2配置
│   ├── start.sh                # 启动脚本
│   ├── start-pm2.sh           # PM2启动脚本
│   └── README.md               # Web应用说明
├── docs/                       # 文档
│   ├── 安装指南.md
│   ├── 快速开始.md
│   └── 发布说明.md
└── version.json                # 版本信息
\`\`\`

## 🚀 快速开始

### 桌面应用
1. 进入 \`desktop/\` 目录
2. 选择对应平台的安装包
3. 安装并运行

### Web应用
1. 进入 \`web/\` 目录
2. 运行 \`./start-pm2.sh\`
3. 访问 http://localhost:3000

## 📖 详细文档

- [安装指南](docs/安装指南.md) - 详细的安装说明
- [快速开始](docs/快速开始.md) - 使用教程和技巧
- [发布说明](docs/发布说明.md) - 版本特性和更新日志

## ✨ 主要特性

- 🖥️ 跨平台桌面应用 (macOS, Windows)
- 🌐 Web应用支持服务器部署
- 📊 支持Excel和CSV文件导入
- 🔄 智能分类映射
- 📈 实时导入进度
- 🔙 支持撤销导入
- 📱 响应式设计

## 📋 系统要求

### 桌面应用
- macOS 10.12+ 或 Windows 7+
- 512MB+ 内存
- 200MB 存储空间

### Web应用
- Node.js 16.0.0+
- 256MB+ 内存
- 现代浏览器

## 📞 技术支持

如需帮助，请查看文档或联系技术支持。

---
版本: v1.0.0 | 构建时间: ${new Date().toLocaleString('zh-CN')}
`

fs.writeFileSync(path.join(releaseDir, 'README.md'), mainReadme)

// 8. 创建最终压缩包
console.log('📦 创建最终发布包...')

try {
  const timestamp = new Date().toISOString().slice(0, 10)
  const archiveName = `记账数据导入工具-v1.0.0-${timestamp}.tar.gz`
  
  execSync(`tar -czf "${archiveName}" -C "${path.dirname(releaseDir)}" "${path.basename(releaseDir)}"`, 
    { stdio: 'inherit' })
  
  const archiveStats = fs.statSync(archiveName)
  console.log(`✅ 发布包创建完成: ${archiveName} (${(archiveStats.size / 1024 / 1024).toFixed(1)}MB)`)
} catch (error) {
  console.log('⚠️ 压缩包创建失败，但发布文件已准备完成')
}

// 9. 生成文件清单
const manifest = {
  releaseInfo: {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    totalSize: 0
  },
  desktop: {},
  web: {
    description: 'Web应用部署包，支持PM2管理',
    path: 'web/',
    startCommand: './start-pm2.sh'
  },
  docs: [
    'docs/安装指南.md',
    'docs/快速开始.md', 
    'docs/发布说明.md'
  ]
}

// 计算桌面应用文件大小
electronFiles.forEach(filename => {
  const filePath = path.join(desktopDir, filename)
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    manifest.desktop[filename] = {
      size: stats.size,
      sizeHuman: `${(stats.size / 1024 / 1024).toFixed(1)}MB`
    }
    manifest.releaseInfo.totalSize += stats.size
  }
})

manifest.releaseInfo.totalSizeHuman = `${(manifest.releaseInfo.totalSize / 1024 / 1024).toFixed(1)}MB`

fs.writeFileSync(
  path.join(releaseDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
)

console.log('')
console.log('🎉 最终打包完成!')
console.log(`📁 发布目录: ${releaseDir}`)
console.log('')
console.log('📋 发布内容:')
console.log('🖥️ 桌面应用:')
Object.entries(manifest.desktop).forEach(([name, info]) => {
  console.log(`   - ${name} (${info.sizeHuman})`)
})
console.log('🌐 Web应用: 完整部署包')
console.log('📖 文档: 安装指南、快速开始、发布说明')
console.log('')
console.log(`📊 总大小: ${manifest.releaseInfo.totalSizeHuman}`)
console.log('✅ 所有文件已准备就绪，可以发布！') 