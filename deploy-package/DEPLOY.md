# 部署说明

## 快速部署

1. 上传整个目录到服务器
2. 执行部署脚本：
   ```bash
   chmod +x server-setup.sh
   ./server-setup.sh
   ```

## 手动部署

1. 安装依赖：`npm install`
2. 启动应用：`npm run pm2:start`
3. 访问：http://localhost:3006

## 管理命令

- 查看状态：`pm2 status`
- 查看日志：`pm2 logs import-records-app`
- 重启：`pm2 restart import-records-app`
