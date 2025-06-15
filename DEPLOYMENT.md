# 记账数据导入工具 - 生产环境部署指南

## 概述

本文档介绍如何将记账数据导入工具部署到生产服务器，支持通过 PM2 进行进程管理。

## 部署方式

### 方式一：自动部署（推荐）

1. **本地构建部署包**
   ```bash
   npm run deploy
   ```

2. **上传到服务器**
   将生成的 `deploy-package` 目录上传到服务器

3. **服务器端部署**
   ```bash
   cd deploy-package
   chmod +x server-setup.sh
   ./server-setup.sh
   ```

### 方式二：手动部署

1. **本地构建**
   ```bash
   npm install
   npm run build
   ```

2. **准备部署文件**
   - 复制 `dist/` 目录到服务器
   - 复制 `ecosystem.config.js` 到服务器
   - 在服务器上创建简化的 `package.json`

3. **服务器端安装**
   ```bash
   # 安装 serve 和 PM2
   npm install -g serve pm2
   
   # 启动应用
   pm2 start ecosystem.config.js --env production
   ```

## 服务器要求

- **Node.js**: 16.0+ 版本
- **内存**: 最少 512MB
- **磁盘**: 最少 100MB 可用空间
- **网络**: 需要访问外部 API 的网络权限

## 配置说明

### PM2 配置 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'import-records-app',
    script: 'serve',
    args: '-s dist -l 3000',
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 端口配置

默认端口为 3006，如需修改：

1. 编辑 `ecosystem.config.js` 中的 `args` 参数
2. 修改 `env.PORT` 值
3. 重启应用：`pm2 restart import-records-app`

## 管理命令

### PM2 进程管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs import-records-app

# 重启应用
pm2 restart import-records-app

# 停止应用
pm2 stop import-records-app

# 删除应用
pm2 delete import-records-app

# 监控面板
pm2 monit
```

### 日志管理

日志文件位置：
- 错误日志: `./logs/err.log`
- 输出日志: `./logs/out.log`
- 合并日志: `./logs/combined.log`

```bash
# 实时查看日志
pm2 logs import-records-app --lines 100

# 清空日志
pm2 flush
```

## 反向代理配置

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache 配置示例

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://localhost:3006/
    ProxyPassReverse / http://localhost:3006/
</VirtualHost>
```

## 安全配置

### 防火墙设置

```bash
# Ubuntu/Debian
sudo ufw allow 3006/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3006/tcp
sudo firewall-cmd --reload
```

### 进程用户

建议创建专用用户运行应用：

```bash
# 创建用户
sudo useradd -m -s /bin/bash appuser

# 切换到应用用户
sudo su - appuser

# 在应用用户下部署和运行
```

## 监控和维护

### 健康检查

应用提供健康检查端点：
- URL: `http://localhost:3006/`
- 正常响应: 返回应用页面

### 自动重启

PM2 配置了以下自动重启策略：
- 内存超过 1GB 时重启
- 进程异常退出时自动重启
- 系统重启后自动启动

### 备份策略

建议定期备份：
- 应用配置文件
- 日志文件
- 用户数据（如果有本地存储）

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
# 查看端口占用
lsof -i :3006
   
   # 修改配置文件中的端口
   ```

2. **内存不足**
   ```bash
   # 查看内存使用
   free -h
   
   # 调整 PM2 内存限制
   ```

3. **权限问题**
   ```bash
   # 检查文件权限
   ls -la
   
   # 修改权限
   chmod -R 755 dist/
   ```

### 日志分析

```bash
# 查看错误日志
tail -f logs/err.log

# 搜索特定错误
grep "ERROR" logs/combined.log

# 按时间过滤日志
grep "2024-01-01" logs/combined.log
```

## 更新部署

### 更新流程

1. **本地构建新版本**
   ```bash
   npm run deploy
   ```

2. **备份当前版本**
   ```bash
   cp -r deploy-package deploy-package-backup
   ```

3. **上传新版本**
   替换服务器上的文件

4. **重启应用**
   ```bash
   pm2 restart import-records-app
   ```

### 回滚操作

如果新版本有问题，可以快速回滚：

```bash
# 停止当前版本
pm2 stop import-records-app

# 恢复备份版本
cp -r deploy-package-backup/* ./

# 重启应用
pm2 start import-records-app
```

## 性能优化

### 静态文件缓存

在反向代理中配置静态文件缓存：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 压缩配置

启用 gzip 压缩：

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## 联系支持

如果在部署过程中遇到问题，请：

1. 检查日志文件
2. 确认服务器环境符合要求
3. 参考故障排除章节
4. 联系技术支持 