# Vercel 部署检查清单

## 📋 部署前检查

### 代码准备
- [ ] 所有代码已提交到 Git 仓库
- [ ] `.env` 文件已添加到 `.gitignore`（不提交 API Key）
- [ ] `npm run build` 成功构建
- [ ] `npm run lint` 代码检查通过
- [ ] 在本地 `npm run dev` 测试通过

### 依赖检查
- [ ] `package.json` 中所有必需依赖已安装
- [ ] 没有过期或安全问题的包

---

## 🚀 Vercel 部署步骤

### 方式一：GitHub 自动部署（推荐）

#### 1. 准备 GitHub 仓库

```bash
# 初始化 Git 仓库（如果未初始化）
git init

# 添加远程仓库
git remote add origin https://github.com/your-username/notesai.git

# 提交代码
git add .
git commit -m "Initial commit: AI valuation tool"

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 2. 在 Vercel 中导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 连接 GitHub 账户
5. 选择 `notesai` 仓库
6. Vercel 会自动检测到 `vercel.json` 配置

#### 3. 配置项目设置

**Framework Preset**
- 应该自动检测为 `Vite`
- 如果没有，手动选择 `Vite`

**Build Command**
- 默认：`npm run build` ✓

**Output Directory**
- 默认：`dist` ✓

**Environment Variables**
1. 点击 "Environment Variables"
2. 添加变量：
   - **Name**: `KIMI_API_KEY`
   - **Value**: `sk-your_actual_api_key`
   - **Environments**: 选择 `Production`, `Preview`, `Development`
3. 点击 "Add"

#### 4. 部署

1. 点击 "Deploy"
2. 等待构建完成（通常 1-2 分钟）
3. 看到 "Congratulations!" 说明部署成功
4. 点击 "Visit" 查看部署的应用

---

### 方式二：Vercel CLI 部署

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署项目

```bash
vercel --prod
```

#### 4. 配置环境变量

在首次部署时，Vercel 会提示配置环境变量：

```
? Set up and deploy? (Y/n) Y
? Which scope should we deploy to? your-account
? Link to existing project? (y/N) N
? What's your project's name? notesai
? In which directory is your code? .
? Want to modify vercel.json? (Y/n) N
```

然后访问 Vercel Dashboard 添加环境变量。

---

## 🔐 环境变量配置详解

### Vercel Dashboard 配置

1. **项目设置** → **Environment Variables**
2. **添加新变量**

```
Variable Name: KIMI_API_KEY
Value: sk-jswgcx2KKxA4xrgrYSVn57SVUpj58YXc63CtnYSn6aTxMSwx
Environments: ☑ Production  ☑ Preview  ☑ Development
```

### 三个环境的区别

| 环境 | 说明 | 何时使用 |
|------|------|--------|
| Production | 生产环境 | 主分支（main） |
| Preview | 预览环境 | Pull Request 或其他分支 |
| Development | 开发环境 | 本地开发 |

---

## ✅ 部署后验证

### 1. 访问应用

```
https://notesai.vercel.app
```

或您自定义的域名。

### 2. 测试 API

#### 测试图片识别

```bash
curl -X POST https://notesai.vercel.app/api/identify \
  -H "Content-Type: application/json" \
  -d '{"image":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'
```

#### 测试对话 API

```bash
curl -X POST https://notesai.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"商品信息：名称=iPhone 13,类别=电子产品,品牌=Apple"}]}'
```

### 3. 浏览器调试

1. 打开应用首页
2. 打开浏览器 DevTools（F12）
3. 切换到 Network 标签
4. 上传图片并进行测试
5. 检查 API 调用是否成功

---

## 🔄 持续部署

### 自动更新

配置完成后，每次 `git push` 到 `main` 分支，Vercel 会自动：
1. 拉取最新代码
2. 运行 `npm run build`
3. 部署到生产环境

### 预览部署

对其他分支或 PR 的每次推送，Vercel 会生成预览 URL：
```
https://notesai-pr-123.vercel.app
```

### 回滚部署

1. 在 Vercel Dashboard 中找到项目
2. 点击 "Deployments"
3. 找到之前的部署版本
4. 点击 "..." → "Promote to Production"

---

## 🚨 常见部署问题

### 问题 1：Build Failed - "Module not found"

**原因**：缺少依赖

**解决**：
```bash
npm install
npm run build
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### 问题 2：API 返回 401（Unauthorized）

**原因**：环境变量未设置或错误

**解决**：
1. Vercel Dashboard → Environment Variables
2. 确认 `KIMI_API_KEY` 存在且值正确
3. 重新部署：点击最新部署 → "Redeploy"

### 问题 3：CORS 错误

**原因**：跨域请求被阻止

**解决**：
- API 在后端调用，不会有 CORS 问题
- 检查浏览器控制台是否有其他错误

### 问题 4：超时错误（504）

**原因**：API 请求超过 Vercel 限制（10 秒）

**解决**：
- 检查网络连接
- 检查 Moonshot API 是否可用
- 增加超时重试逻辑

---

## 📊 监控和日志

### 查看构建日志

1. Vercel Dashboard → 项目 → "Deployments"
2. 点击部署版本
3. 点击 "View Build Logs"

### 查看函数调用日志

1. Vercel Dashboard → 项目 → "Logs"
2. 选择 "Functions" 标签
3. 实时查看 API 调用日志

### 性能监控

1. Vercel Dashboard → "Analytics"
2. 查看响应时间、吞吐量等指标

---

## 🔗 自定义域名（可选）

### 添加自定义域名

1. Vercel Dashboard → 项目 → "Settings"
2. 点击 "Domains"
3. 输入您的域名：`valuationtool.com`
4. 按提示配置 DNS 记录
5. 等待验证完成（通常 5-10 分钟）

### DNS 配置示例

如果使用阿里云 DNSPod 等 DNS 服务：

```
记录类型: CNAME
主机记录: valuationtool
记录值: cname.vercel-dns.com
```

---

## 💰 成本考虑

### Vercel 免费额度

- 构建时间：6000 分钟/月（足够日常使用）
- 函数调用：无限制
- 数据传输：100GB/月（足够）
- 自定义域名：支持

### 成本优化

1. 使用 Vercel 的免费计划
2. 缓存 API 响应
3. 压缩图片大小
4. 使用 CDN 加速静态资源

---

## ✨ 部署完成！

恭喜！你的 AI 库存估价工具已成功部署到 Vercel！

### 下一步

1. 📱 在手机和桌面测试应用
2. 📊 监控 API 调用和性能
3. 🔄 设置自动更新和通知
4. 🎯 收集用户反馈和优化

### 分享应用

```
您的应用 URL：https://notesai.vercel.app
```

---

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel 环境变量指南](https://vercel.com/docs/concepts/projects/environment-variables)
- [Moonshot API 文档](https://platform.moonshot.cn/docs)
- [Vite 部署指南](https://vite.dev/guide/static-deploy.html)

---

**祝您部署顺利！有问题可以查看详细的 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** 🚀
