# AI 库存估价工具 - 部署指南

## 📋 项目概述

这是一个基于 **Vite + React + TypeScript** 的 AI 库存估价工具，支持：
- 📸 商品图片上传与识别
- 🤖 AI 多轮对话询问
- 💰 智能估价与报价
- 🚀 Vercel 无服务器部署

---

## 🚀 快速开始

### 1. 本地开发

#### 安装依赖
```bash
npm install
```

#### 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

---

### 2. 环境配置

#### `.env` 文件配置

在项目根目录创建 `.env` 文件：

```env
KIMI_API_KEY=your_kimi_api_key_here
```

**获取 API Key：**
- 访问 [Moonshot AI 官网](https://moonshot.cn)
- 注册账户并创建 API Key
- 复制密钥到 `.env` 文件

#### 重要提示
- **不要提交 `.env` 到 Git**
- `.gitignore` 已包含 `.env`
- 生产环境在 Vercel 中配置环境变量

---

## 🏗️ 项目结构

```
cc_test/
├── api/                          # Serverless API 函数
│   ├── identify.js              # 商品识别 API
│   ├── chat.js                  # 多轮对话 API
│   └── generate.js              # 脚本生成 API
├── src/
│   ├── App.tsx                  # 主应用组件
│   ├── main.tsx                 # 入口文件
│   ├── index.css                # 全局样式
│   └── components/              # React 组件
├── public/                       # 静态资源
├── dev-server.js                # 本地开发服务器
├── vite.config.ts               # Vite 配置
├── vercel.json                  # Vercel 配置
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 依赖管理
```

---

## 🔌 API 文档

### `/api/identify` - 商品识别

**请求：**
```json
{
  "image": "base64_encoded_image_string"
}
```

**响应：**
```json
{
  "name": "商品名称",
  "category": "商品类别",
  "brand": "品牌"
}
```

---

### `/api/chat` - 多轮对话估价

**请求：**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "商品信息：..."
    }
  ]
}
```

**响应（未完成）：**
```json
{
  "question": "商品成色如何？",
  "done": false
}
```

**响应（完成）：**
```json
{
  "estimated_price": "$10-$15",
  "resale_price": "$20-$30",
  "quick_sale_price": "$8-$10",
  "confidence": "medium",
  "reason": "根据市场行情分析...",
  "done": true
}
```

---

## 📦 构建与部署

### 本地构建测试

```bash
npm run build
npm run preview
```

### 部署到 Vercel

#### 方式一：使用 Vercel CLI

1. 安装 Vercel CLI
```bash
npm install -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署
```bash
vercel
```

#### 方式二：GitHub 连接

1. 将项目推送到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 导入项目
3. 自动检测 `vercel.json` 配置
4. 配置环境变量：
   - 进入项目设置
   - 找到 "Environment Variables"
   - 添加 `KIMI_API_KEY`
5. 自动部署

---

## ⚙️ 环境变量配置（Vercel）

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `KIMI_API_KEY` | `sk-xxxxx...` | Moonshot API Key |

---

## 🛠️ 开发相关命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# Linting
npm run lint
```

---

## 🐛 故障排查

### 问题 1：API 返回 401 错误

**原因：** API Key 无效或过期

**解决：**
1. 检查 `.env` 中的 API Key
2. 访问 Moonshot 官网验证 Key 状态
3. 重新生成 Key 并更新

### 问题 2：图片无法识别

**原因：** 图片格式或大小问题

**解决：**
1. 确保图片 < 10MB
2. 使用常见格式：JPG, PNG
3. 检查网络连接

### 问题 3：本地开发代理失败

**原因：** dev-server.js 未启动

**解决：**
```bash
npm run dev  # 会同时启动 Vite 和 dev-server
```

---

## 📊 性能优化建议

1. **图片压缩**
   - 上传前压缩图片
   - 建议 < 5MB

2. **缓存策略**
   - 使用浏览器缓存
   - 减少重复请求

3. **错误处理**
   - 添加重试机制
   - 友好的错误提示

---

## 🔐 安全建议

1. **API Key 管理**
   - 不要在代码中硬编码 API Key
   - 使用环境变量
   - 定期轮换 Key

2. **请求限制**
   - 添加速率限制
   - 防止 API 滥用

3. **数据隐私**
   - 用户图片不要保存
   - 遵守当地数据保护法规

---

## 📈 扩展功能建议

1. **用户系统**
   - 估价历史记录
   - 用户认证

2. **更多商品类型**
   - 电子产品
   - 服装鞋类
   - 家居用品

3. **数据分析**
   - 估价准确度评估
   - 市场趋势分析

4. **多语言支持**
   - 国际化 i18n
   - 多币种显示

---

## 📞 支持与反馈

- 🐛 Bug 报告：创建 GitHub Issue
- 💡 功能建议：讨论与反馈
- 📧 联系：support@example.com

---

## 📄 许可证

MIT License

---

## 更新日志

### v1.0.0 (2024-04-19)
- ✅ 初始版本发布
- ✅ 完成图片识别功能
- ✅ 完成多轮对话估价
- ✅ Vercel 部署支持
