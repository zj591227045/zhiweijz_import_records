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
echo "- 运行端口: 3006"
echo "- 访问地址: http://$(hostname -I | awk '{print $1}'):3006"
echo "- 日志目录: ./logs/"
echo ""
echo "📋 常用命令："
echo "- 查看状态: pm2 status"
echo "- 查看日志: pm2 logs import-records-app"
echo "- 重启应用: pm2 restart import-records-app"
echo "- 停止应用: pm2 stop import-records-app"
echo ""
echo "🔧 如需修改端口，请编辑 ecosystem.config.js 文件" 