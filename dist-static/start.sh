#!/bin/bash

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
