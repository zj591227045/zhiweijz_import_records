#!/bin/bash

# 记账数据导入工具 - 生产环境部署脚本
# 使用方法: ./scripts/deploy.sh

set -e

echo "🚀 开始部署记账数据导入工具..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node --version
npm --version

# 检查是否已经安装了依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install --production=false
else
  echo "✅ 依赖已存在，跳过安装"
fi

# 类型检查
echo "🔍 执行类型检查..."
npm run type-check

# 构建生产版本
echo "🏗️  构建生产版本..."
npm run build

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
cp -r dist deploy-package/
cp ecosystem.config.js deploy-package/

# 检查并复制服务器安装脚本
if [ -f "scripts/server-setup.sh" ]; then
  cp scripts/server-setup.sh deploy-package/
else
  echo "⚠️  server-setup.sh 不存在，将在部署包中创建"
fi

# 创建生产环境的 package.json
cat > deploy-package/package.json << EOF
{
  "name": "import-records-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "serve -s dist -l 3000",
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

# 创建 README
cat > deploy-package/README.md << EOF
# 记账数据导入工具 - 生产环境部署

## 快速部署

1. 上传整个 deploy-package 目录到服务器
2. 在服务器上执行：
   \`\`\`bash
   cd deploy-package
   chmod +x server-setup.sh
   ./server-setup.sh
   \`\`\`

## 手动部署

1. 安装依赖：
   \`\`\`bash
   npm install
   \`\`\`

2. 启动应用：
   \`\`\`bash
   # 使用 PM2 启动
   npm run pm2:start
   
   # 或直接启动
   npm start
   \`\`\`

## PM2 管理命令

- 启动：\`npm run pm2:start\`
- 停止：\`npm run pm2:stop\`
- 重启：\`npm run pm2:restart\`
- 删除：\`npm run pm2:delete\`
- 查看状态：\`pm2 status\`
- 查看日志：\`pm2 logs import-records-app\`

## 访问地址

应用将在 http://localhost:3000 启动

## 目录结构

- \`dist/\` - 构建后的静态文件
- \`ecosystem.config.js\` - PM2 配置文件
- \`logs/\` - 应用日志目录（自动创建）
EOF

# 创建服务器安装脚本（如果不存在）
if [ ! -f "deploy-package/server-setup.sh" ]; then
cat > deploy-package/server-setup.sh << 'EOF'
#!/bin/bash

# 服务器端安装脚本
# 在生产服务器上运行此脚本来部署应用

set -e

echo "🚀 开始在服务器上部署记账数据导入工具..."

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then
  echo "⚠️  建议不要使用 root 用户运行此脚本"
  read -p "是否继续？(y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装，请先安装 Node.js 18+ 版本"
  echo "可以使用以下命令安装："
  echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
  echo "sudo apt-get install -y nodejs"
  exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "❌ Node.js 版本过低，需要 16+ 版本，当前版本: $(node --version)"
  exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
  echo "📦 安装 PM2..."
  npm install -g pm2
else
  echo "✅ PM2 已安装: $(pm2 --version)"
fi

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p logs

# 安装依赖
echo "📦 安装应用依赖..."
npm install --production

# 停止可能存在的旧进程
echo "🛑 停止旧进程..."
pm2 delete import-records-app 2>/dev/null || true

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 保存 PM2 进程列表
echo "💾 保存 PM2 配置..."
pm2 save

# 设置 PM2 开机自启
echo "⚙️  设置开机自启..."
pm2 startup 2>/dev/null || echo "⚠️  请手动执行 PM2 提示的命令来设置开机自启"

# 显示状态
echo "📊 应用状态："
pm2 status

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 应用信息："
echo "- 应用名称: import-records-app"
echo "- 运行端口: 3000"
echo "- 访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "- 日志目录: ./logs/"
echo ""
echo "📋 常用命令："
echo "- 查看状态: pm2 status"
echo "- 查看日志: pm2 logs import-records-app"
echo "- 重启应用: pm2 restart import-records-app"
echo "- 停止应用: pm2 stop import-records-app"
echo ""
echo "🔧 如需修改端口，请编辑 ecosystem.config.js 文件"
EOF

chmod +x deploy-package/server-setup.sh
fi

echo "📦 部署包已创建在 deploy-package/ 目录"
echo "🎉 部署准备完成！"
echo ""
echo "📋 下一步操作："
echo "1. 将 deploy-package/ 目录上传到服务器"
echo "2. 在服务器上执行: cd deploy-package && chmod +x server-setup.sh && ./server-setup.sh"
echo "3. 访问 http://your-server:3000" 