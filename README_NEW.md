# 💎 AI 库存估价工具

![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

一个智能库存估价工具，支持商品图片识别和 AI 多轮对话估价。适用于清仓、滞销、二手、闲置商品的快速估价。

## ✨ 核心功能

- 📸 **商品图片识别** - 自动识别商品名称、类别、品牌
- 🤖 **AI 多轮对话** - 最多 5 轮智能对话，逐步提升估价准确度
- 💰 **多维度报价** - 收货价、转售价、快速出货价
- 📊 **置信度评估** - 显示估价的可信度和原因
- 🚀 **无服务器部署** - 一键部署到 Vercel
- 📱 **响应式设计** - 完美支持手机和桌面

## 🚀 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/vervegrow-cmyk/notesai.git
cd notesai
npm install
```

### 2. 配置环境

在项目根目录创建 `.env` 文件：

```env
KIMI_API_KEY=your_moonshot_api_key
```

[获取 Moonshot API Key](https://moonshot.cn)

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

## 📦 项目结构

```
├── api/                    # Serverless API 函数
│   ├── identify.js        # 商品识别
│   ├── chat.js            # 多轮对话估价
│   └── generate.js        # 脚本生成（其他功能）
├── src/
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   └── components/        # React 组件
├── public/                # 静态资源
├── vite.config.ts         # Vite 配置
├── vercel.json            # Vercel 配置
└── tsconfig.json          # TypeScript 配置
```

## 🔌 API 文档

### 商品识别 API

```bash
POST /api/identify
```

**请求：**
```json
{ "image": "base64_encoded_string" }
```

**响应：**
```json
{
  "name": "iPhone 13 Pro",
  "category": "电子产品",
  "brand": "Apple"
}
```

### 多轮对话 API

```bash
POST /api/chat
```

**请求：**
```json
{
  "messages": [
    { "role": "user", "content": "商品信息：..." }
  ]
}
```

**响应（进行中）：**
```json
{
  "question": "商品成色如何？",
  "done": false
}
```

**响应（完成）：**
```json
{
  "estimated_price": "$450-$500",
  "resale_price": "$550-$650",
  "quick_sale_price": "$400-$450",
  "confidence": "high",
  "reason": "根据市场行情分析...",
  "done": true
}
```

## 📋 可用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建
npm run preview

# 代码检查
npm run lint
```

## 🌐 部署到 Vercel

### 自动部署（推荐）

1. 推送到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com) 导入项目
3. 添加环境变量 `KIMI_API_KEY`
4. 自动构建和部署

### 手动部署

```bash
npm install -g vercel
vercel login
vercel
```

[详细部署指南](./DEPLOYMENT_GUIDE.md)

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **样式**：Tailwind CSS 4
- **UI 组件**：自定义组件（无第三方 UI 库）
- **状态管理**：React Hooks
- **AI 服务**：Moonshot API (Kimi)
- **部署**：Vercel Serverless Functions

## 📖 文档

- [部署指南](./DEPLOYMENT_GUIDE.md) - 详细的部署步骤和故障排查
- [技术实现文档](./TECHNICAL_GUIDE.md) - 架构设计和实现细节

## 🐛 常见问题

**Q: 如何获取 API Key？**
A: 访问 [Moonshot 官网](https://moonshot.cn)，注册账户并创建 API Key。

**Q: 支持哪些图片格式？**
A: 支持 JPG、PNG 等常见格式，建议 < 5MB。

**Q: 可以离线使用吗？**
A: 不能。需要网络连接调用 Moonshot AI API。

**Q: 用户上传的图片会保存吗？**
A: 不会。图片只用于实时识别，不会存储。

## 💡 功能扩展

- [ ] 用户认证系统
- [ ] 估价历史记录
- [ ] 更多商品类别支持
- [ ] 多语言支持
- [ ] 数据分析仪表板

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- GitHub：[@vervegrow-cmyk](https://github.com/vervegrow-cmyk)
- 邮箱：support@example.com

---

**祝您使用愉快！** 🎉
