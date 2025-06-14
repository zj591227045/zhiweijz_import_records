#!/bin/bash

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
echo "📍 访问地址: http://localhost:3006"
echo "📊 查看状态: npm run pm2:monit"
echo "📋 查看日志: npm run pm2:logs"
