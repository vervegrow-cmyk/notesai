# Inventory Liquidity AI

> AI 驱动的库存估价工具，专为清仓、滞销、二手、闲置商品设计。

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## 功能

上传商品图片、视频或 Excel 表格，AI 自动识别后通过多轮对话了解商品详情，输出三维估价结果。

| 估价维度 | 说明 |
|----------|------|
| 收货价 | 建议收购入手价格 |
| 转售价 | 正常渠道转卖的预期价格 |
| 快速出货价 | 需要快速变现时的建议价格 |

**支持的输入格式：**

- 图片：JPG / PNG（最大 10 MB）
- 视频：MP4 / MOV（自动提取关键帧）
- 表格：XLSX / CSV（批量选品，支持嵌入图片提取）

---

## 快速开始

### 1. 克隆 & 安装

```bash
git clone https://github.com/vervegrow-cmyk/Inventory-Liquidity-AI.git
cd Inventory-Liquidity-AI
npm install
```

### 2. 配置环境变量

```bash
# 创建 .env 文件
echo "KIMI_API_KEY=你的_Kimi_API_Key" > .env
```

> 获取 API Key：[platform.moonshot.cn](https://platform.moonshot.cn) → API Keys

### 3. 启动

```bash
npm run dev
```

浏览器打开 [http://localhost:5173](http://localhost:5173)

> `npm run dev` 会同时启动 Vite 前端（:5173）和 Node.js API 服务（:3001）。

---

## 项目结构

```
Inventory-Liquidity-AI/
│
├── skills/                     # AI 能力层（原子操作，无业务逻辑）
│   ├── kimiClient.js           #   Kimi API 基础调用封装
│   ├── kimiVision.js           #   图像 / 文本商品识别
│   └── kimiGenerate.js         #   自由内容生成
│
├── agents/                     # AI 流程编排层
│   ├── pricingAgent.js         #   多轮定价对话流程（含 retry）
│   └── identifyAgent.js        #   识别任务分发（图像 vs 文本）
│
├── features/                   # 业务模块（controller + service）
│   ├── pricing/
│   │   ├── controller.js       #   请求校验 → 调用 service → 标准响应
│   │   └── service.js          #   业务逻辑（调用 agent）
│   ├── identify/
│   │   ├── controller.js
│   │   └── service.js
│   └── generate/
│       ├── controller.js
│       └── service.js
│
├── backend/                    # 后端基础设施
│   ├── api-core/
│   │   ├── response.js         #   统一响应：success() / fail()
│   │   └── errors.js           #   错误码枚举
│   └── middlewares/
│       └── logger.js           #   请求 / 错误日志
│
├── lib/
│   └── utils.js                # 后端工具函数（parseJson 等）
│
├── dev-server.js               # Node.js HTTP 服务器（路由 → controller）
│
└── src/                        # 前端（React + TypeScript）
    ├── types/index.ts           #   全局类型定义
    ├── lib/
    │   ├── utils.ts             #   前端工具函数
    │   └── media.ts             #   文件处理（视频帧提取、Excel 解析）
    ├── repositories/
    │   ├── inventoryRepo.ts     #   笔记数据访问层（封装 Dexie）
    │   └── folderRepo.ts        #   文件夹数据访问层
    ├── services/
    │   ├── pricingApi.ts        #   定价 API 调用封装
    │   └── identifyApi.ts       #   识别 API 调用封装
    ├── ui/
    │   ├── components/
    │   │   └── PriceCard.tsx    #   价格展示卡片
    │   └── blocks/
    │       └── ChatPanel.tsx    #   AI 对话面板
    ├── stores/notesStore.ts     #   Zustand 全局状态
    └── App.tsx                  #   主应用（阶段路由 + 状态管理）
```

---

## API 参考

所有接口统一返回格式：

```json
// 成功
{ "success": true, "data": {}, "message": "ok" }

// 失败
{ "success": false, "error": { "code": "ERROR_CODE", "message": "描述" } }
```

错误码：`VALIDATION_ERROR` / `UNAUTHORIZED` / `NOT_FOUND` / `INTERNAL_ERROR` / `AI_ERROR`

### POST /api/identify/analyze

识别商品信息（图像 或 文本）。

```json
// 请求（图片）
{ "image": "<base64>" }

// 请求（表格文本）
{ "text": "产品名称: iPhone..., 品牌: Apple" }

// 响应
{
  "success": true,
  "data": { "name": "iPhone 13 Pro", "category": "电子产品", "brand": "Apple" }
}
```

### POST /api/pricing/calculate

执行一轮定价对话。

```json
// 请求
{
  "messages": [
    { "role": "user", "content": "商品信息：名称=iPhone 13 Pro，类别=电子产品，品牌=Apple" }
  ]
}

// 响应（对话进行中）
{
  "success": true,
  "data": { "question": "商品成色如何？1-9成新？", "done": false }
}

// 响应（估价完成）
{
  "success": true,
  "data": {
    "estimated_price": "$350-$400",
    "resale_price": "$450-$520",
    "quick_sale_price": "$300-$340",
    "confidence": "high",
    "reason": "根据 9 成新 + 完整包装，市场需求旺盛...",
    "done": true
  }
}
```

### POST /api/generate/content

自由内容生成。

```json
// 请求
{ "input": "写一段该商品的出售描述" }

// 响应
{ "success": true, "data": { "result": "..." } }
```

> 兼容旧路径：`/api/chat` → `/api/pricing/calculate`，`/api/identify` → `/api/identify/analyze`

---

## 分层调用规则

```
前端 App.tsx
  └── services/pricingApi.ts        (fetch 封装)
        └── POST /api/pricing/calculate
              └── features/pricing/controller.js   (请求校验)
                    └── features/pricing/service.js (业务逻辑)
                          └── agents/pricingAgent.js (流程编排)
                                └── skills/kimiClient.js (AI 调用)
```

数据访问：`stores/notesStore` → `repositories/*` → `services/db.ts (Dexie)`

---

## 可用命令

```bash
npm run dev      # 启动开发服务器（前端 + API）
npm run build    # TypeScript 编译 + Vite 构建
npm run preview  # 预览生产构建
npm run lint     # ESLint 检查
```

---

## 部署

### Vercel

1. 将项目推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. Environment Variables 添加 `KIMI_API_KEY`
4. 点击部署

> 注意：Vercel 部署需将 `dev-server.js` 逻辑迁移为 Vercel Serverless Functions（`/api/*.js`）。本地开发使用 `dev-server.js` + Vite proxy。

### 本地生产预览

```bash
npm run build && npm run preview
```

---

## 安全说明

- `.env` 已加入 `.gitignore`，API Key 不会提交到仓库
- 所有 AI 调用在服务端执行，Key 不暴露到前端

---

## License

MIT
