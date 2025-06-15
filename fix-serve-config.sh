#!/bin/bash

# 快速修复 PM2 配置中的 serve 命令参数问题
# 在服务器的 deploy-package 目录中运行此脚本

set -e

echo "🔧 修复 PM2 配置中的 serve 命令参数..."

# 检查当前目录
if [ ! -f "ecosystem.config.js" ]; then
  echo "❌ 错误：请在 deploy-package 目录中运行此脚本"
  exit 1
fi

# 备份原配置
cp ecosystem.config.js ecosystem.config.js.backup
echo "✅ 已备份原配置文件"

# 修复 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'import-records-app',
      script: 'serve',
      args: '-s dist -p 3006',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

echo "✅ 已修复 ecosystem.config.js"

# 修复 package.json
cp package.json package.json.backup
cat > package.json << 'EOF'
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

echo "✅ 已修复 package.json"

# 停止旧进程
echo "🛑 停止旧进程..."
pm2 delete import-records-app 2>/dev/null || echo "没有找到旧进程"

# 重新启动
echo "🚀 重新启动应用..."
pm2 start ecosystem.config.js --env production

# 保存配置
pm2 save

echo ""
echo "🎉 修复完成！"
echo ""
echo "📊 应用状态："
pm2 status

echo ""
echo "📋 应用信息："
echo "- 应用名称: import-records-app"
echo "- 运行端口: 3006"
echo "- 访问地址: http://$(hostname -I | awk '{print $1}'):3006"
echo ""
echo "📋 管理命令："
echo "- 查看状态: pm2 status"
echo "- 查看日志: pm2 logs import-records-app"
echo "- 重启应用: pm2 restart import-records-app" 