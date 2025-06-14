# 记账数据导入工具 - 桌面应用构建指南

## 概述
本项目已配置为支持Electron桌面应用打包，可以生成macOS和Windows的可执行文件。

## ✅ 问题解决方案

### 已修复问题：
1. **macOS白屏问题** - 修复了生产环境路径配置
2. **Windows构建失败** - 配置了国内镜像源

### 快速构建（推荐）
```bash
# 使用便捷脚本（自动配置镜像源）
./scripts/build.sh all    # 构建所有平台
./scripts/build.sh mac    # 只构建macOS
./scripts/build.sh win    # 只构建Windows
```

### 手动安装依赖（如果需要）
```bash
# 设置镜像源
npm config set registry https://registry.npmmirror.com
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

# 安装依赖
npm install --save-dev electron electron-builder concurrently wait-on
```

## 项目结构
```
your-project/
├── electron/           # Electron主进程文件
│   └── main.js        # 已创建
├── src/               # Vue源码
├── dist/              # Vue构建输出
├── dist-electron/     # Electron应用输出
└── package.json       # 已配置Electron脚本
```

## 构建步骤

### 1. 安装依赖
```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

### 2. 开发测试
```bash
# 启动开发模式（Vue + Electron）
npm run electron:dev
```

### 3. 构建应用

#### 构建所有平台
```bash
npm run build:all
```

#### 单独构建macOS
```bash
npm run build:mac
```

#### 单独构建Windows
```bash
npm run build:win
```

## 输出文件

构建完成后，可执行文件将生成在 `dist-electron/` 目录：

### macOS
- `记账数据导入工具-{version}.dmg` - DMG安装包
- `记账数据导入工具.app` - 应用程序包

### Windows
- `记账数据导入工具 Setup {version}.exe` - NSIS安装程序
- `记账数据导入工具 {version}.exe` - 便携版可执行文件

## 应用特性

- ✅ 跨平台支持 (macOS, Windows)
- ✅ 原生菜单栏
- ✅ 单实例运行
- ✅ 自动更新支持（可扩展）
- ✅ 开发者工具集成
- ✅ 优雅的窗口管理

## 图标配置

请确保 `public/favicon.ico` 存在，作为应用图标。
建议图标尺寸：256x256px 或更高。

## 故障排除

### 如果遇到权限问题 (macOS)
```bash
sudo xattr -r -d com.apple.quarantine /path/to/your/app.app
```

### 如果遇到代码签名问题
在 `package.json` 的 `build.mac` 中添加：
```json
"identity": null
```

### 网络问题
如果下载Electron二进制文件失败，可以设置镜像：
```bash
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
```

## 开发建议

1. **测试应用**: 先使用 `npm run electron:dev` 测试应用功能
2. **渐进构建**: 先构建单平台，确保无误后再构建全平台  
3. **资源优化**: 生产环境下关闭开发者工具和调试功能
4. **更新策略**: 考虑集成自动更新机制

## 技术栈

- **前端**: Vue 3 + TypeScript + Element Plus
- **构建**: Vite + Electron Builder
- **桌面**: Electron 框架
- **打包**: 支持DMG、NSIS、便携版等格式 