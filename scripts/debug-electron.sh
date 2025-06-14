#!/bin/bash

echo "🔧 启动Electron调试模式..."

# 设置环境变量
export NODE_ENV=development
export ELECTRON_DEBUG=true
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8

# 显示环境信息
echo "📊 环境变量:"
echo "  NODE_ENV: $NODE_ENV"
echo "  ELECTRON_DEBUG: $ELECTRON_DEBUG"
echo "  LANG: $LANG"
echo "  LC_ALL: $LC_ALL"

# 启动应用
echo "🚀 启动应用..."
electron .
