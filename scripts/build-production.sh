#!/bin/bash

# 生产环境构建脚本
# 只安装构建必需的依赖，避免 electron 等开发工具

set -e

echo "🚀 开始构建生产版本..."

# 检查环境
echo "📋 检查环境..."
node --version
npm --version

# 创建临时的 package.json，只包含构建必需的依赖
echo "📦 准备构建依赖..."
cat > package-build.json << EOF
{
  "name": "import-records-app-build",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "vite build",
    "type-check": "vue-tsc --build"
  },
  "dependencies": {
    "@element-plus/icons-vue": "^2.3.1",
    "axios": "^1.9.0",
    "crypto-js": "^4.2.0",
    "dayjs": "^1.11.13",
    "element-plus": "^2.10.1",
    "file-saver": "^2.0.5",
    "lodash": "^4.17.21",
    "papaparse": "^5.5.3",
    "pinia": "^3.0.1",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tsconfig/node22": "^22.0.1",
    "@types/crypto-js": "^4.2.2",
    "@types/lodash": "^4.17.17",
    "@types/node": "^22.14.0",
    "@types/papaparse": "^5.3.16",
    "@vitejs/plugin-vue": "^5.2.3",
    "@vue/eslint-config-prettier": "^10.2.0",
    "@vue/eslint-config-typescript": "^14.5.0",
    "@vue/tsconfig": "^0.7.0",
    "typescript": "~5.8.0",
    "vite": "^6.2.4",
    "vite-plugin-vue-devtools": "^7.7.2",
    "vue-tsc": "^2.2.8"
  }
}
EOF

# 备份原始 package.json
if [ -f "package.json" ]; then
  cp package.json package.json.backup
fi

# 使用构建专用的 package.json
cp package-build.json package.json

# 清理旧的 node_modules
echo "🧹 清理旧依赖..."
rm -rf node_modules package-lock.json

# 安装构建依赖
echo "📦 安装构建依赖..."
npm install

# 类型检查
echo "🔍 执行类型检查..."
npm run type-check || echo "⚠️  类型检查有警告，继续构建..."

# 构建
echo "🏗️  构建生产版本..."
npm run build

# 恢复原始 package.json
if [ -f "package.json.backup" ]; then
  mv package.json.backup package.json
fi

# 清理临时文件
rm -f package-build.json

# 检查构建结果
if [ ! -d "dist" ]; then
  echo "❌ 构建失败：dist 目录不存在"
  exit 1
fi

echo "✅ 构建完成！"

# 创建部署包
echo "📦 创建部署包..."
rm -rf deploy-package
mkdir -p deploy-package

# 复制构建文件
cp -r dist deploy-package/
cp ecosystem.config.js deploy-package/

# 复制服务器安装脚本
if [ -f "scripts/server-setup.sh" ]; then
  cp scripts/server-setup.sh deploy-package/
  chmod +x deploy-package/server-setup.sh
fi

# 创建生产环境的 package.json
cat > deploy-package/package.json << EOF
{
  "name": "import-records-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "serve -s dist -p 3006",
    "pm2:start": "pm2 start ecosystem.config.js --env production",
    "pm2:stop": "pm2 stop import-records-app",
    "pm2:restart": "pm2 restart import-records-app",
    "pm2:delete": "pm2 delete import-records-app"
  },
  "dependencies": {
    "serve": "^14.2.1"
  }
}
EOF

# 创建部署说明
cat > deploy-package/DEPLOY.md << EOF
# 部署说明

## 快速部署

1. 上传整个目录到服务器
2. 执行部署脚本：
   \`\`\`bash
   chmod +x server-setup.sh
   ./server-setup.sh
   \`\`\`

## 手动部署

1. 安装依赖：\`npm install\`
2. 启动应用：\`npm run pm2:start\`
3. 访问：http://localhost:3006

## 管理命令

- 查看状态：\`pm2 status\`
- 查看日志：\`pm2 logs import-records-app\`
- 重启：\`pm2 restart import-records-app\`
EOF

echo "📦 部署包已创建在 deploy-package/ 目录"
echo "📊 部署包大小："
du -sh deploy-package/

echo ""
echo "🎉 构建完成！"
echo ""
echo "📋 下一步操作："
echo "1. 将 deploy-package/ 目录上传到服务器"
echo "2. 在服务器上执行: cd deploy-package && chmod +x server-setup.sh && ./server-setup.sh"
echo "3. 访问 http://your-server:3006" 