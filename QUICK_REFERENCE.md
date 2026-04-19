# 🚀 快速命令参考

## 本地开发

### 首次设置

```bash
# 1. 安装依赖
npm install

# 2. 创建 .env 文件（复制 .env.example）
cp .env.example .env

# 3. 编辑 .env，添加 API Key
# 打开 .env 编辑：KIMI_API_KEY=your_api_key

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器
# http://localhost:5173
```

### 日常开发命令

```bash
# 启动开发服务器（包含热刷新）
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview

# 代码检查和修复
npm run lint

# 清理构建文件
rm -rf dist node_modules
npm install
npm run build
```

---

## Git 工作流

```bash
# 初始化 Git
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "feat: Add AI valuation feature"

# 添加远程仓库
git remote add origin https://github.com/username/notesai.git

# 推送到 GitHub
git push -u origin main

# 查看状态
git status

# 查看日志
git log --oneline -5
```

---

## Vercel 部署

### 使用 Vercel CLI

```bash
# 全局安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod

# 查看部署日志
vercel logs
```

### 使用 GitHub 自动部署

```bash
# 推送代码到 GitHub
git push origin main

# Vercel 会自动检测到推送并部署
# 访问 Vercel Dashboard 查看部署状态
# https://vercel.com/dashboard
```

---

## 环境配置

### 本地 .env 文件

```bash
# 编辑环境变量（不要提交到 Git）
nano .env  # 或用你的编辑器打开

# 内容格式
KIMI_API_KEY=sk-your_api_key_here
```

### Vercel 环境变量

```bash
# 通过 CLI 设置
vercel env add KIMI_API_KEY

# 然后在 Vercel Dashboard 中验证
# Settings → Environment Variables
```

---

## 调试和测试

### 浏览器开发工具

```bash
# 打开后按 F12 或右键 → 检查
# Network 标签：查看 API 调用
# Console 标签：查看日志和错误
# Elements 标签：查看 DOM 结构
# Application 标签：查看本地存储
```

### 测试 API

```bash
# 测试图片识别 API
curl -X POST http://localhost:3001/api/identify \
  -H "Content-Type: application/json" \
  -d '{"image":"iVBORw0KGgo..."}'

# 测试对话 API
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"商品信息：..."}]}'
```

### 查看服务器日志

```bash
# dev-server.js 会输出日志到控制台
# 启动 npm run dev 后观察输出
# 查看 API 调用信息
```

---

## 常用快捷键

| 操作 | 快捷键 |
|------|--------|
| 启动开发服务器 | `npm run dev` |
| 构建生产版本 | `npm run build` |
| 保存文件 (VS Code) | `Ctrl+S` / `Cmd+S` |
| 打开浏览器开发工具 | `F12` |
| 刷新页面 | `F5` / `Cmd+R` |
| 硬刷新（清除缓存） | `Ctrl+Shift+R` / `Cmd+Shift+R` |
| 开发工具 Network 标签 | `F12 → Network` |
| 开发工具 Console 标签 | `F12 → Console` |

---

## 故障排查命令

```bash
# 检查 Node 版本
node --version  # 需要 v18+

# 检查 npm 版本
npm --version  # 需要 v8+

# 清理 npm 缓存
npm cache clean --force

# 重装依赖
rm -rf node_modules package-lock.json
npm install

# 检查端口占用（开发服务器无法启动）
# macOS/Linux
lsof -i :5173
lsof -i :3001

# Windows（使用 PowerShell）
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# 杀死占用端口的进程
# macOS/Linux
kill -9 <PID>

# Windows（使用 PowerShell 管理员）
taskkill /PID <PID> /F
```

---

## 项目文件快速导航

```bash
# 编辑主应用组件
open src/App.tsx  # 或用你的编辑器

# 查看 API 文件
open api/identify.js
open api/chat.js

# 查看配置
open vite.config.ts
open vercel.json
open tsconfig.json

# 查看环境变量
open .env.example
open .env  # 本地专用，不提交 Git

# 查看文档
open README.md
open DEPLOYMENT_GUIDE.md
open TECHNICAL_GUIDE.md
open VERCEL_DEPLOYMENT.md
```

---

## 包管理命令

```bash
# 添加新依赖
npm install package-name

# 添加开发依赖
npm install --save-dev package-name

# 更新所有依赖
npm update

# 检查过期依赖
npm outdated

# 查看安装的包
npm list --depth=0

# 卸载依赖
npm uninstall package-name

# 检查安全问题
npm audit

# 修复安全问题
npm audit fix
```

---

## VS Code 扩展推荐

```json
{
  "recommended": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

安装：在 VS Code 扩展中搜索插件名，点击 Install

---

## 更多帮助

- 📖 完整部署指南：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 🔧 技术实现文档：[TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)
- 🚀 Vercel 部署步骤：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- 📝 项目说明：[README_NEW.md](./README_NEW.md)

---

## 快速检查清单

```
部署前检查：
☐ npm run build 成功
☐ npm run lint 无错误
☐ 本地 npm run dev 正常运行
☐ .env 文件配置正确
☐ 代码已提交到 Git
☐ .env 已在 .gitignore

Vercel 部署检查：
☐ GitHub 仓库已创建
☐ Vercel 项目已导入
☐ 环境变量 KIMI_API_KEY 已配置
☐ 构建日志无错误
☐ 部署完成，应用可访问

后续维护：
☐ 定期更新依赖
☐ 监控 API 调用量
☐ 检查错误日志
☐ 收集用户反馈
```

---

祝您开发顺利！有任何问题欢迎查阅文档或提交 Issue。 🎉
