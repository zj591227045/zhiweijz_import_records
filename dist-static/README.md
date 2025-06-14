# 记账数据导入工具 - 静态部署版本

## 快速开始

### 方式一：直接启动
```bash
./start.sh
```

### 方式二：使用PM2（推荐生产环境）
```bash
./start-pm2.sh
```

## PM2管理命令

- 启动服务：`npm run pm2:start`
- 停止服务：`npm run pm2:stop`
- 重启服务：`npm run pm2:restart`
- 删除服务：`npm run pm2:delete`
- 查看日志：`npm run pm2:logs`
- 监控状态：`npm run pm2:monit`

## 环境变量

- `PORT`: 服务端口（默认：3000）
- `HOST`: 绑定地址（默认：0.0.0.0）
- `NODE_ENV`: 运行环境（默认：production）

## 访问地址

服务启动后，访问：http://localhost:3000

## 系统要求

- Node.js >= 16.0.0
- PM2（可选，用于进程管理）

## 目录结构

```
dist-static/
├── dist/           # 前端构建文件
├── server.js       # HTTP服务器
├── ecosystem.config.js  # PM2配置
├── package.json    # 依赖配置
├── start.sh        # 直接启动脚本
├── start-pm2.sh    # PM2启动脚本
└── README.md       # 说明文档
```
