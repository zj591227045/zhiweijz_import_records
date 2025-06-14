# 只为记账 - 数据导入工具

一个专为"只为记账"系统设计的数据导入桌面应用，支持从Excel和CSV文件批量导入记账数据。

## 📋 项目简介

这是一个基于Vue 3 + Element Plus + Electron开发的桌面应用程序，旨在帮助用户轻松地将其他记账应用的数据导入到"只为记账"系统中。应用提供了直观的向导式界面，支持文件上传、数据预览、分类映射、批量导入等功能。

## ✨ 主要功能

### 🔧 服务器配置
- 支持官方服务器和自定义服务器配置
- 实时健康状态检查
- 自动保存配置信息
- 安全的用户认证

### 📁 文件处理
- 支持Excel格式（.xlsx, .xls）
- 支持CSV格式（.csv）
- 拖拽上传和点击选择
- 自动文件格式检测和解析
- 文件大小限制（建议<10MB）

### 🎯 数据处理
- 智能数据解析和验证
- 实时数据预览
- 灵活的分类映射配置
- 批量数据导入
- 详细的进度显示

### 📊 导入管理
- 实时导入进度监控
- 详细的导入报告
- 成功/失败统计
- 一键撤销导入功能
- 错误日志查看

### 🎨 用户体验
- 现代化的界面设计
- 响应式布局
- 多步骤向导流程
- 详细的帮助文档
- 用户手册下载

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 在另一个终端启动Electron
npm run electron:dev
```

### 构建应用
```bash
# 构建Web版本
npm run build

# 构建桌面应用
npm run electron:build

# 完整构建（推荐）
./scripts/build-final.sh
```

## 📖 使用指南

### 客户端安装和启动

#### macOS 客户端

**方式一：使用打包版本（推荐）**
1. 下载 `记账数据导入工具.dmg` 安装包
2. 双击DMG文件，将应用拖拽到Applications文件夹
3. 在Launchpad或Applications文件夹中找到应用并启动
4. 如遇到安全提示，请在"系统偏好设置 > 安全性与隐私"中允许运行

**方式二：开发环境运行**
```bash
# 克隆项目
git clone <repository-url>
cd zhiweijz_import_records

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在另一个终端启动Electron
npm run electron:dev
```

**方式三：本地构建**
```bash
# 完整构建
./scripts/build-final.sh

# 构建完成后启动
open "dist-electron/mac-arm64/记账数据导入工具.app"
```

**macOS 故障排除**
- 如遇白屏问题，请参考 `scripts/DEBUG_GUIDE.md`
- 移除隔离属性：`sudo xattr -r -d com.apple.quarantine "记账数据导入工具.app"`
- 查看控制台日志：打开"控制台"应用，搜索"记账数据导入工具"

#### Windows 客户端

**方式一：使用安装程序（推荐）**
1. 下载 `记账数据导入工具-Setup.exe` 安装程序
2. 右键以管理员身份运行安装程序
3. 按照安装向导完成安装
4. 在开始菜单或桌面找到应用图标并启动

**方式二：使用便携版**
1. 下载 `记账数据导入工具-Portable.zip` 压缩包
2. 解压到任意文件夹
3. 双击 `记账数据导入工具.exe` 启动应用

**方式三：开发环境运行**
```bash
# 克隆项目
git clone <repository-url>
cd zhiweijz_import_records

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在另一个终端启动Electron
npm run electron:dev
```

**方式四：本地构建**
```bash
# 完整构建
./scripts/build-final.sh

# 构建完成后启动
./dist-electron/win-unpacked/记账数据导入工具.exe
```

**Windows 故障排除**
- 如遇到安全警告，请选择"更多信息"然后"仍要运行"
- 确保已安装 Visual C++ Redistributable
- 如遇到权限问题，请以管理员身份运行

#### Linux 客户端

**方式一：使用AppImage（推荐）**
```bash
# 下载AppImage文件
chmod +x 记账数据导入工具.AppImage
./记账数据导入工具.AppImage
```

**方式二：使用DEB包（Ubuntu/Debian）**
```bash
sudo dpkg -i 记账数据导入工具.deb
# 如有依赖问题
sudo apt-get install -f
```

**方式三：开发环境运行**
```bash
# 安装Node.js和npm
sudo apt-get update
sudo apt-get install nodejs npm

# 克隆项目
git clone <repository-url>
cd zhiweijz_import_records

# 安装依赖
npm install

# 启动应用
npm run dev
npm run electron:dev
```

### 应用使用流程

### 第一步：配置服务器
1. 启动应用后点击"开始导入"
2. 选择服务器类型（官方服务器或自定义服务器）
3. 输入服务器地址（如：https://app.zhiweijz.cn:1443）
4. 输入用户名和密码
5. 点击"测试连接"验证配置
6. 连接成功后点击"下一步"

### 第二步：上传文件
1. 点击"选择文件"或拖拽文件到上传区域
2. 支持Excel (.xlsx, .xls) 和CSV (.csv) 格式
3. 确保文件包含必需的列：日期、金额、描述
4. 上传成功后系统会自动解析文件内容
5. 解析成功后点击"下一步"

### 第三步：调整分类映射
1. 查看系统检测到的所有分类
2. 为每个分类选择对应的系统分类
3. 未映射的分类将使用默认分类
4. 预览数据确保解析结果正确
5. 确认无误后点击"下一步"

### 第四步：导入记录
1. 确认导入设置和数据预览
2. 点击"开始导入"启动导入过程
3. 实时查看导入进度和状态
4. 导入完成后自动跳转到报告页面

### 第五步：查看报告
1. 查看导入成功和失败的记录数量
2. 查看详细的导入统计信息
3. 如有失败记录，可查看具体错误原因
4. 点击"查看账本数据"跳转到记账系统
5. 如需要，可以撤销本次导入

## 📄 文件格式要求

### 必需的列
- **日期**：交易日期，支持多种日期格式（如：2024-01-01）
- **金额**：交易金额，支持正负数
- **描述**：交易描述或备注
- **分类**：交易分类

### 可选列
- **人员**：交易人员


### 格式示例
```csv
日期,金额,描述,分类
2024-01-01,100.00,工资收入,收入
2024-01-02,-50.00,午餐费用,餐饮
2024-01-03,-200.00,购物支出,购物
```

## 🛠️ 开发相关

### 项目结构
```
├── src/                    # 源代码
│   ├── components/         # Vue组件
│   ├── views/             # 页面视图
│   ├── api/               # API接口
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript类型定义
├── scripts/               # 构建和测试脚本
│   ├── build-desktop.js   # 桌面应用构建配置
│   ├── build-static.js    # 静态部署构建配置
│   ├── test-*.html        # 测试页面
│   └── DEBUG_GUIDE.md     # 调试指南
├── electron/              # Electron主进程代码
└── dist/                  # 构建输出目录
```

### 可用脚本
```bash
# 开发
npm run dev                 # 启动开发服务器
npm run electron:dev        # 启动Electron开发模式

# 构建
npm run build              # 构建Web版本
npm run electron:build     # 构建桌面应用
./scripts/build-final.sh   # 完整构建

# 测试
./scripts/test-minimal.sh     # 基础环境测试
./scripts/test-vue-basic.sh   # Vue功能测试
./scripts/test-vue-full.sh    # 完整集成测试

# 调试
./scripts/build-debug.sh      # 构建调试版本
./scripts/start-debug.sh      # 启动调试版本
```

### 技术栈
- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **路由管理**：Vue Router
- **状态管理**：Pinia
- **构建工具**：Vite
- **桌面框架**：Electron
- **HTTP客户端**：Axios
- **文件处理**：SheetJS (xlsx)

## 🔧 部署选项

### 桌面应用分发

#### macOS 分发包
```bash
# 构建macOS应用
./scripts/build-final.sh

# 生成的文件：
# - dist-electron/mac-arm64/记账数据导入工具.app (ARM64版本)
# - dist-electron/mac-x64/记账数据导入工具.app (Intel版本)
# - dist-electron/记账数据导入工具-1.0.0-arm64.dmg (ARM64安装包)
# - dist-electron/记账数据导入工具-1.0.0.dmg (Intel安装包)
```

**分发说明：**
- DMG安装包：用户双击安装，拖拽到Applications文件夹
- APP文件：可直接运行，适合企业内部分发
- 支持Apple Silicon (M1/M2) 和Intel处理器
- 自动代码签名（需配置开发者证书）

#### Windows 分发包
```bash
# 构建Windows应用
./scripts/build-final.sh

# 生成的文件：
# - dist-electron/win-unpacked/ (未打包版本)
# - dist-electron/记账数据导入工具-Setup-1.0.0.exe (NSIS安装程序)
# - dist-electron/记账数据导入工具-1.0.0-win.zip (便携版压缩包)
```

**分发说明：**
- NSIS安装程序：标准Windows安装体验，支持卸载
- 便携版：解压即用，无需安装，适合企业环境
- 支持x64和ia32架构
- 自动更新支持（可选配置）

#### Linux 分发包
```bash
# 构建Linux应用
./scripts/build-final.sh

# 生成的文件：
# - dist-electron/记账数据导入工具-1.0.0.AppImage (AppImage格式)
# - dist-electron/记账数据导入工具_1.0.0_amd64.deb (DEB包)
```

**分发说明：**
- AppImage：通用Linux格式，无需安装依赖
- DEB包：适用于Ubuntu/Debian系统
- 支持x64架构
- 桌面集成和文件关联

### Web应用部署

#### 静态文件部署
```bash
# 构建Web版本
npm run build

# 部署到Web服务器
cp -r dist/* /var/www/html/
```

#### PM2进程管理
```bash
# 使用PM2部署
./scripts/build-static.js
pm2 start ecosystem.config.js
```

#### Docker容器部署
```bash
# 构建Docker镜像
docker build -t zhiweijz-import .
docker run -p 3000:3000 zhiweijz-import
```

#### 云平台部署
- **Vercel/Netlify**：直接连接Git仓库自动部署
- **阿里云/腾讯云**：上传静态文件到OSS/COS
- **自建服务器**：使用Nginx/Apache托管静态文件

### 构建配置

#### 桌面应用构建
```bash
# 完整构建（所有平台）
./scripts/build-final.sh

# 仅构建当前平台
npm run electron:build

# 构建特定平台
npm run electron:build -- --mac
npm run electron:build -- --win
npm run electron:build -- --linux
```

#### 构建选项配置
在 `scripts/build-desktop.js` 中可以配置：
- 应用图标和元数据
- 代码签名证书
- 自动更新服务器
- 安装包格式和选项
- 文件关联和协议处理

详细的部署说明请参考 `scripts/README.md`。

## ❓ 常见问题

### 文件上传失败
- 检查文件格式是否为支持的Excel或CSV格式
- 确认文件大小不超过限制（建议<10MB）
- 检查网络连接是否正常

### 数据解析错误
- CSV文件建议使用UTF-8编码
- 确保日期格式正确（如：2024-01-01）
- 检查金额格式为数字
- 确认包含必需的列：日期、金额、描述

### 导入失败
- 检查服务器连接是否正常
- 确认用户名和密码正确
- 查看详细错误信息并根据提示处理

### macOS白屏问题
如果在macOS上遇到白屏问题，请参考 `scripts/DEBUG_GUIDE.md` 进行排查。

## 📞 技术支持

如果您在使用过程中遇到问题，可以：

1. 查看应用内的帮助文档
2. 下载用户手册进行参考
3. 查看项目的调试指南
4. 联系技术支持团队

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

---

**只为记账 - 数据导入工具** © 2024
