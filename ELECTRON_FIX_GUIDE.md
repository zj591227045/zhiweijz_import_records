# Electron 路径修复指南

## 问题描述

在将Vue 3 + Vite应用打包为Electron桌面应用时，遇到了白屏问题。主要原因是：

1. **HTML路径问题**: Vite构建的HTML使用相对路径 `./assets/`，在Electron的file协议下无法正确解析
2. **动态导入路径问题**: Vue Router的懒加载和动态导入使用了错误的路径格式
3. **打包后路径问题**: 应用打包到app.asar后，路径解析出现重复的`assets`目录

## 解决方案

### 1. 修复构建文件路径 (`scripts/fix-dynamic-imports.js`)

修复Vite构建后的文件中的路径问题：
- 将HTML中的 `./assets/` 改为 `assets/`
- 修复JS文件中的动态导入路径
- 确保favicon路径正确

### 2. 修复打包后应用 (`scripts/fix-packaged-app.js`)

修复Electron打包后app.asar中的路径问题：
- 解压app.asar文件
- 修复其中的HTML和JS文件路径
- 重新打包app.asar

### 3. 完整构建流程 (`scripts/build-and-fix.js`)

提供一键式构建和修复流程：
1. 清理旧构建文件
2. 构建Vue应用
3. 修复构建文件路径
4. 构建Electron应用
5. 修复打包后应用
6. 显示构建结果

## 使用方法

### 快速构建（推荐）
```bash
npm run build:complete
```

### 分步构建
```bash
# 1. 正常构建
npm run build:all

# 2. 修复打包后的应用
npm run fix:packaged
```

### 测试应用
```bash
npm run test:apps
```

## 脚本说明

| 脚本 | 功能 | 使用场景 |
|------|------|----------|
| `fix:packaged` | 修复已打包的应用 | 构建完成后发现白屏问题 |
| `build:complete` | 完整构建和修复流程 | 一键构建可用的应用 |
| `test:apps` | 测试应用启动 | 验证修复是否成功 |

## 技术细节

### 路径问题分析

**问题路径**:
```
file:///path/to/app.asar/dist/assets/assets/component.css
```

**正确路径**:
```
file:///path/to/app.asar/dist/assets/component.css
```

### 修复原理

1. **HTML修复**: 将相对路径改为基于当前目录的路径
   ```html
   <!-- 修复前 -->
   <link rel="stylesheet" href="./assets/index.css">
   
   <!-- 修复后 -->
   <link rel="stylesheet" href="assets/index.css">
   ```

2. **JS动态导入修复**: 修复Vue Router懒加载路径
   ```javascript
   // 修复前
   import("./assets/HomePage.js")
   
   // 修复后  
   import("./HomePage.js")
   ```

### 工具依赖

- `asar`: 用于解压和重新打包app.asar文件
- `electron-builder`: Electron应用打包工具

## 常见问题

### Q: 为什么需要修复两次？
A: 第一次修复构建文件，第二次修复打包后的asar文件。因为electron-builder会重新处理文件，可能引入新的路径问题。

### Q: 修复后还是白屏怎么办？
A: 
1. 检查控制台错误信息
2. 运行 `npm run test:apps` 验证启动
3. 手动打开应用查看开发者工具

### Q: Windows版本如何测试？
A: 在Windows系统上运行相应的.exe文件，或使用虚拟机测试。

## 构建结果

成功构建后会生成以下文件：

- **macOS Intel**: `记账数据导入工具-0.0.0.dmg` (~124MB)
- **macOS Apple Silicon**: `记账数据导入工具-0.0.0-arm64.dmg` (~119MB)  
- **Windows 安装包**: `记账数据导入工具 Setup 0.0.0.exe` (~179MB)
- **Windows 便携版**: `记账数据导入工具 0.0.0.exe` (~178MB)

## 验证成功

应用启动后应该能看到：
- ✅ Vue应用正常加载
- ✅ 路由导航正常
- ✅ Element Plus组件正常显示
- ✅ 中文字符正常显示
- ✅ 动态导入的组件正常加载

## 注意事项

1. 每次修改Vue代码后，建议使用 `npm run build:complete` 重新构建
2. 修复脚本会自动备份原始文件（.backup后缀）
3. 如果修复失败，会自动恢复备份文件
4. 建议在不同平台上测试应用的兼容性 