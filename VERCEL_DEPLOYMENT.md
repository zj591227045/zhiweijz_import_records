# 记账数据导入工具 - Vercel 部署指南

## 概述

本文档详细介绍如何将记账数据导入工具部署到 Vercel 平台。该应用是一个纯前端 Vue 3 SPA 应用，非常适合在 Vercel 上部署。

## 项目特点

- **技术栈**: Vue 3 + TypeScript + Element Plus + Vite
- **应用类型**: 单页面应用 (SPA)
- **依赖**: 无后端依赖，仅调用外部 API
- **构建工具**: Vite
- **部署方式**: 静态文件托管

## 部署前准备

### 1. 环境要求

- Node.js 16+ 
- npm 或 yarn
- Git 仓库（GitHub、GitLab 或 Bitbucket）

### 2. 项目配置检查

确保以下文件已正确配置：
- ✅ `vercel.json` - 简化的 Vercel 部署配置（仅包含 SPA 路由重写）
- ✅ `package.json` - 包含 `vercel-build` 脚本
- ✅ `vite.config.ts` - 优化的构建配置
- ✅ `.env.example` - 环境变量模板
- ✅ 修复了无效的区域代码问题

## 部署方式

### 方式一：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择 Git 仓库
   - 选择本项目仓库

3. **配置项目**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (项目根目录)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **环境变量配置**
   ```
   NODE_ENV=production
   VITE_APP_TITLE=记账数据导入工具
   VITE_DEFAULT_API_BASE_URL=https://app.zhiweijz.cn:1443
   VITE_MAX_FILE_SIZE=10
   VITE_BATCH_SIZE=100
   ```

5. **部署**
   - 点击 "Deploy" 开始部署
   - 等待构建完成（通常 2-5 分钟）

### 方式二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **初始化项目**
   ```bash
   vercel
   ```
   按提示配置项目设置

4. **部署**
   ```bash
   # 部署到预览环境
   vercel
   
   # 部署到生产环境
   vercel --prod
   ```

## 环境变量配置

### 必需的环境变量

在 Vercel Dashboard 的 Settings > Environment Variables 中添加：

```bash
# 基础配置
NODE_ENV=production
VITE_APP_TITLE=记账数据导入工具

# API 配置
VITE_DEFAULT_API_BASE_URL=https://app.zhiweijz.cn:1443
VITE_OFFICIAL_SERVER_URL=https://app.zhiweijz.cn:1443

# 功能配置
VITE_MAX_FILE_SIZE=10
VITE_BATCH_SIZE=100
VITE_SUPPORTED_FILE_TYPES=.xlsx,.xls,.csv

# 安全配置
VITE_FORCE_HTTPS=true
VITE_CSP_ENABLED=true
```

### 可选的环境变量

```bash
# 调试配置（仅开发环境）
VITE_DEBUG_MODE=false
VITE_VERBOSE_LOGGING=false

# 分析工具（如果需要）
VITE_ANALYTICS_ENABLED=false
VITE_GA_ID=your-ga-id

# 错误监控（如果需要）
VITE_SENTRY_DSN=your-sentry-dsn
```

## 域名配置

### 使用 Vercel 提供的域名

部署成功后，Vercel 会自动分配一个域名：
- 格式: `https://your-project-name.vercel.app`
- 支持 HTTPS
- 全球 CDN 加速

### 使用自定义域名

1. **在 Vercel Dashboard 中配置**
   - 进入项目设置
   - 点击 "Domains"
   - 添加自定义域名

2. **DNS 配置**
   - 添加 CNAME 记录指向 `cname.vercel-dns.com`
   - 或添加 A 记录指向 Vercel 提供的 IP

3. **SSL 证书**
   - Vercel 自动提供免费 SSL 证书
   - 支持自动续期

## 性能优化

### 构建优化

项目已配置以下优化：
- ✅ 代码分割 (Code Splitting)
- ✅ 资源压缩 (Minification)
- ✅ Tree Shaking
- ✅ 静态资源缓存
- ✅ Gzip 压缩

### CDN 配置

Vercel 自动提供：
- ✅ 全球 CDN 分发
- ✅ 智能缓存策略
- ✅ 边缘计算优化
- ✅ 自动图片优化

## 监控和分析

### Vercel Analytics

1. **启用 Analytics**
   - 在项目设置中启用 Vercel Analytics
   - 查看访问量、性能指标等

2. **性能监控**
   - Core Web Vitals 监控
   - 页面加载时间分析
   - 用户体验指标

### 自定义监控

如需更详细的监控，可集成：
- Google Analytics
- Sentry 错误监控
- LogRocket 用户行为分析

## 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 检查构建日志
   vercel logs your-deployment-url
   
   # 本地测试构建
   npm run build
   ```

2. **路由问题**
   - 确保 `vercel.json` 中配置了 SPA 路由重定向
   - 检查 `public/_redirects` 文件

3. **环境变量问题**
   - 确保环境变量以 `VITE_` 开头
   - 检查变量名拼写
   - 重新部署以应用新的环境变量

4. **静态资源 404**
   - 检查 `vite.config.ts` 中的 `base` 配置
   - 确保资源路径正确

### 调试方法

1. **查看构建日志**
   ```bash
   vercel logs
   ```

2. **本地预览**
   ```bash
   npm run build
   npm run preview
   ```

3. **检查网络请求**
   - 使用浏览器开发者工具
   - 检查 API 请求是否正常

## 更新部署

### 自动部署

- 推送到主分支自动触发部署
- 支持预览部署（Pull Request）
- 支持回滚到历史版本

### 手动部署

```bash
# 使用 CLI 部署
vercel --prod

# 或在 Dashboard 中手动触发
```

## 安全配置

### HTTPS 强制

- Vercel 默认强制 HTTPS
- 自动重定向 HTTP 到 HTTPS

### 安全头

已配置的安全头：
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 成本说明

### Vercel 免费计划

- ✅ 100GB 带宽/月
- ✅ 无限静态网站
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ Git 集成

### 付费计划

如需更多资源，可升级到 Pro 计划：
- 更多带宽
- 更快构建时间
- 高级分析功能
- 团队协作功能

## 联系支持

如果在部署过程中遇到问题：

1. 查看 [Vercel 官方文档](https://vercel.com/docs)
2. 检查项目的构建日志
3. 参考本文档的故障排除章节
4. 联系项目维护者

---

**部署成功后，您的记账数据导入工具将可以通过 Vercel 提供的 URL 全球访问！**
