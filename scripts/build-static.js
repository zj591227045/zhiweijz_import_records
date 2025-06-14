#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 开始构建静态文件包...')

const outputDir = path.join(__dirname, '../dist-static')
const distDir = path.join(__dirname, '../dist')

// 清理输出目录
if (fs.existsSync(outputDir)) {
  console.log('🧹 清理旧的输出目录...')
  fs.rmSync(outputDir, { recursive: true, force: true })
}

// 创建输出目录
fs.mkdirSync(outputDir, { recursive: true })

// 1. 构建Vue应用
console.log('📦 构建Vue应用...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Vue应用构建完成')
} catch (error) {
  console.error('❌ Vue应用构建失败:', error.message)
  process.exit(1)
}

// 2. 运行路径修复
console.log('🔧 修复资源路径...')
try {
  execSync('node scripts/fix-electron-paths.js', { stdio: 'inherit' })
  execSync('node scripts/fix-dynamic-imports.js', { stdio: 'inherit' })
  console.log('✅ 路径修复完成')
} catch (error) {
  console.error('❌ 路径修复失败:', error.message)
  process.exit(1)
}

// 3. 复制构建文件
console.log('📁 复制构建文件...')
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

copyDir(distDir, path.join(outputDir, 'dist'))
console.log('✅ 构建文件复制完成')

// 4. 创建简单的HTTP服务器
const serverScript = `#!/usr/bin/env node

const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')))

// SPA路由支持
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Index file not found')
  }
})

app.listen(PORT, HOST, () => {
  console.log(\`🚀 记账数据导入工具服务器启动成功!\`)
  console.log(\`📍 访问地址: http://\${HOST}:\${PORT}\`)
  console.log(\`🕐 启动时间: \${new Date().toLocaleString('zh-CN')}\`)
  console.log(\`📊 进程ID: \${process.pid}\`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\\n🛑 收到SIGTERM信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\\n🛑 收到SIGINT信号，正在关闭服务器...')
  process.exit(0)
})
`

fs.writeFileSync(path.join(outputDir, 'server.js'), serverScript)
console.log('✅ HTTP服务器脚本创建完成')

// 5. 创建PM2配置文件
const pm2Config = {
  apps: [{
    name: 'import-records-app',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
}

fs.writeFileSync(path.join(outputDir, 'ecosystem.config.js'), 
  `module.exports = ${JSON.stringify(pm2Config, null, 2)}`)
console.log('✅ PM2配置文件创建完成')

// 6. 创建package.json
const staticPackageJson = {
  name: 'import-records-app-static',
  version: '1.0.0',
  description: '记账数据导入工具 - 静态部署版本',
  main: 'server.js',
  scripts: {
    start: 'node server.js',
    'pm2:start': 'pm2 start ecosystem.config.js',
    'pm2:stop': 'pm2 stop import-records-app',
    'pm2:restart': 'pm2 restart import-records-app',
    'pm2:delete': 'pm2 delete import-records-app',
    'pm2:logs': 'pm2 logs import-records-app',
    'pm2:monit': 'pm2 monit'
  },
  dependencies: {
    express: '^4.18.2'
  },
  engines: {
    node: '>=16.0.0'
  }
}

fs.writeFileSync(path.join(outputDir, 'package.json'), 
  JSON.stringify(staticPackageJson, null, 2))
console.log('✅ package.json创建完成')

// 7. 创建启动脚本
const startScript = `#!/bin/bash

echo "🚀 启动记账数据导入工具..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建日志目录
mkdir -p logs

# 启动服务
echo "🔄 启动服务器..."
npm start
`

fs.writeFileSync(path.join(outputDir, 'start.sh'), startScript)
fs.chmodSync(path.join(outputDir, 'start.sh'), '755')
console.log('✅ 启动脚本创建完成')

// 8. 创建PM2启动脚本
const pm2StartScript = `#!/bin/bash

echo "🚀 使用PM2启动记账数据导入工具..."

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建日志目录
mkdir -p logs

# 启动PM2服务
echo "🔄 启动PM2服务..."
npm run pm2:start

echo "✅ 服务启动完成!"
echo "📍 访问地址: http://localhost:3000"
echo "📊 查看状态: npm run pm2:monit"
echo "📋 查看日志: npm run pm2:logs"
`

fs.writeFileSync(path.join(outputDir, 'start-pm2.sh'), pm2StartScript)
fs.chmodSync(path.join(outputDir, 'start-pm2.sh'), '755')
console.log('✅ PM2启动脚本创建完成')

// 9. 创建README
const readme = `# 记账数据导入工具 - 静态部署版本

## 快速开始

### 方式一：直接启动
\`\`\`bash
./start.sh
\`\`\`

### 方式二：使用PM2（推荐生产环境）
\`\`\`bash
./start-pm2.sh
\`\`\`

## PM2管理命令

- 启动服务：\`npm run pm2:start\`
- 停止服务：\`npm run pm2:stop\`
- 重启服务：\`npm run pm2:restart\`
- 删除服务：\`npm run pm2:delete\`
- 查看日志：\`npm run pm2:logs\`
- 监控状态：\`npm run pm2:monit\`

## 环境变量

- \`PORT\`: 服务端口（默认：3000）
- \`HOST\`: 绑定地址（默认：0.0.0.0）
- \`NODE_ENV\`: 运行环境（默认：production）

## 访问地址

服务启动后，访问：http://localhost:3000

## 系统要求

- Node.js >= 16.0.0
- PM2（可选，用于进程管理）

## 目录结构

\`\`\`
dist-static/
├── dist/           # 前端构建文件
├── server.js       # HTTP服务器
├── ecosystem.config.js  # PM2配置
├── package.json    # 依赖配置
├── start.sh        # 直接启动脚本
├── start-pm2.sh    # PM2启动脚本
└── README.md       # 说明文档
\`\`\`
`

fs.writeFileSync(path.join(outputDir, 'README.md'), readme)
console.log('✅ README文档创建完成')

// 10. 创建压缩包
console.log('📦 创建压缩包...')
try {
  const archiveName = `import-records-app-static-${new Date().toISOString().slice(0, 10)}.tar.gz`
  execSync(`tar -czf ${archiveName} -C ${path.dirname(outputDir)} ${path.basename(outputDir)}`, 
    { stdio: 'inherit' })
  console.log(`✅ 压缩包创建完成: ${archiveName}`)
} catch (error) {
  console.log('⚠️ 压缩包创建失败，但静态文件已准备完成')
}

console.log('')
console.log('🎉 静态文件打包完成!')
console.log(`📁 输出目录: ${outputDir}`)
console.log('')
console.log('📋 使用说明:')
console.log('1. 将dist-static目录部署到服务器')
console.log('2. 运行 ./start.sh 直接启动')
console.log('3. 或运行 ./start-pm2.sh 使用PM2管理')
console.log('4. 访问 http://localhost:3000') 