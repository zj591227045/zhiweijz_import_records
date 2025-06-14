@echo off
echo 🔧 启动Electron调试模式...

REM 设置环境变量
set NODE_ENV=development
set ELECTRON_DEBUG=true
set LANG=zh_CN.UTF-8
set LC_ALL=zh_CN.UTF-8

REM 显示环境信息
echo 📊 环境变量:
echo   NODE_ENV: %NODE_ENV%
echo   ELECTRON_DEBUG: %ELECTRON_DEBUG%
echo   LANG: %LANG%
echo   LC_ALL: %LC_ALL%

REM 启动应用
echo 🚀 启动应用...
electron .
