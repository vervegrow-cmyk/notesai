# AI 库存估价工具 - 技术实现文档

## 🎯 完整工作流程

```
┌─────────────┐
│   用户上传   │
│   商品图片   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 前端：FileReader     │
│ 转换为 Base64       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ POST /api/identify              │
│ body: { image: "base64..." }    │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ API: identify.js                 │
│ 调用 Moonshot Vision API         │
│ 识别商品信息                      │
└──────┬───────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 前端：获取商品信息               │
│ { name, category, brand }        │
│ 进入聊天界面                      │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ POST /api/chat                   │
│ body: {                          │
│   messages: [{                   │
│     role: "user",                │
│     content: "商品信息..."       │
│   }]                             │
│ }                                │
└──────┬───────────────────────────┘
       │
       ▼
┌───────────────────────────────────┐
│ API: chat.js                      │
│ 调用 Moonshot Chat API            │
│ AI 提出第1个问题                  │
│ 返回: { question: "...", done: false }
└──────┬────────────────────────────┘
       │
       ▼ (循环 2-5 轮)
┌──────────────────────────────────┐
│ 用户回答问题                      │
│ 添加到 messages 数组             │
│ POST /api/chat                   │
└──────┬───────────────────────────┘
       │
       ▼
┌───────────────────────────────────┐
│ 检查 done 状态                    │
│ - 继续: 返回下一个问题            │
│ - 结束: 返回估价结果              │
└──────┬────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 前端：显示最终估价结果            │
│ - 收货价                          │
│ - 转售价                          │
│ - 快速出货价                      │
│ - 置信度                          │
│ - 估价原因                        │
└──────────────────────────────────┘
```

---

## 🔄 前端实现细节

### 文件：`src/App.tsx`

#### 状态管理

```typescript
type Phase = 'upload' | 'chatting' | 'done';

interface Product {
  name: string;
  category: string;
  brand: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PricingResult {
  estimated_price: string;
  resale_price: string;
  quick_sale_price: string;
  confidence: string;
  reason: string;
}
```

#### 三个阶段

**1. 上传阶段 (upload)**
- 用户选择图片
- FileReader 转换为 Base64
- 验证图片大小（≤ 10MB）

**2. 对话阶段 (chatting)**
- 发送 Base64 图片到 `/api/identify`
- 获取商品信息
- 进入多轮对话
- 逐步添加消息到 messages 数组

**3. 结果阶段 (done)**
- 显示最终估价结果
- 用户可以重新估价

#### 关键函数

```typescript
// 处理图片选择
handleFileChange(e: React.ChangeEvent<HTMLInputElement>)
  ├─ 读取文件
  ├─ 验证大小
  ├─ FileReader 转换 Base64
  └─ 更新 imageBase64 和 imagePreview

// 开始估价流程
handleStartValuation()
  ├─ POST /api/identify
  ├─ 获取商品信息
  ├─ POST /api/chat (第一轮)
  ├─ 检查 done 状态
  └─ 切换阶段

// 发送用户回答
handleSendAnswer()
  ├─ 添加用户消息到 messages
  ├─ POST /api/chat
  ├─ 处理 AI 响应
  ├─ 检查是否完成
  └─ 更新 UI
```

---

## 🤖 后端实现细节

### API 1: `/api/identify.js` - 商品识别

#### 功能流程

```javascript
export default async function handler(req, res) {
  // 1. 验证请求方法和参数
  if (req.method !== 'POST') return 405

  const { image } = req.body
  if (!image) return 400

  // 2. 调用 Moonshot Vision API
  const response = await fetch(MOONSHOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k-vision-preview',
      messages: [
        { role: 'system', content: '你是商品识别专家...' },
        { 
          role: 'user', 
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
            { type: 'text', text: '识别商品，返回 JSON...' }
          ]
        }
      ]
    })
  })

  // 3. 解析 AI 响应
  const text = response.json().choices[0].message.content
  const parsed = parseJson(text)

  // 4. 返回结构化数据
  return res.status(200).json({
    name: parsed.name || '未知商品',
    category: parsed.category || '其他',
    brand: parsed.brand || '未知'
  })
}
```

#### 关键点
- 使用 Vision API 模型处理图片
- 严格的 JSON 解析（处理 AI 格式变化）
- 容错处理（解析失败时返回默认值）

---

### API 2: `/api/chat.js` - 多轮对话

#### System Prompt（核心规则）

```
你是一个专业库存收货商，擅长估价清仓商品。

规则：
1. 每次只问1个关键问题
2. 最多5轮问答，第5轮必须给出最终估价
3. 问题必须影响价格，不要问废话
4. 始终用JSON格式回复，不要任何多余文字

重点信息：品牌、成色、使用时长、包装情况、市场需求

未结束时输出：{"question":"问题","done":false}
结束时输出：{
  "estimated_price":"$10-$15",
  "resale_price":"$20-$30",
  "quick_sale_price":"$8-$10",
  "confidence":"medium",
  "reason":"原因",
  "done":true
}
```

#### 功能流程

```javascript
export default async function handler(req, res) {
  // 1. 验证请求
  if (req.method !== 'POST') return 405
  
  const { messages } = req.body
  if (!Array.isArray(messages)) return 400

  // 2. 调用 Moonshot Chat API
  const response = await fetch(MOONSHOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages  // 保持对话历史
      ]
    })
  })

  // 3. 解析 AI 响应
  const text = response.json().choices[0].message.content
  const parsed = parseJson(text)

  // 4. 返回 JSON 响应
  return res.status(200).json(parsed)
}
```

#### 关键点
- System Prompt 控制 AI 行为
- 保持完整的 messages 历史（上下文）
- JSON 严格格式要求
- 轮数限制确保流程终止

---

## 📊 数据流示例

### 第1轮：上传图片

**前端请求：**
```json
{
  "image": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgG..."
}
```

**API 响应：**
```json
{
  "name": "iPhone 13 Pro",
  "category": "电子产品",
  "brand": "Apple"
}
```

**前端处理：**
```typescript
messages = [
  {
    role: 'user',
    content: '商品信息：名称=iPhone 13 Pro，类别=电子产品，品牌=Apple'
  }
]
```

### 第1轮对话请求

**前端请求：**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "商品信息：名称=iPhone 13 Pro，类别=电子产品，品牌=Apple"
    }
  ]
}
```

**API 响应：**
```json
{
  "question": "这台 iPhone 13 Pro 的屏幕成色如何？有没有划痕或损伤？",
  "done": false
}
```

### 第2轮对话请求

**前端请求：**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "商品信息：名称=iPhone 13 Pro，类别=电子产品，品牌=Apple"
    },
    {
      "role": "assistant",
      "content": "这台 iPhone 13 Pro 的屏幕成色如何？有没有划痕或损伤？"
    },
    {
      "role": "user",
      "content": "屏幕成色很好，没有划痕，就是电池健康度是85%"
    }
  ]
}
```

**API 响应：**
```json
{
  "question": "手机是否还有原装配件？包括充电器、数据线、包装盒等？",
  "done": false
}
```

### 最终估价（第5轮）

**API 响应：**
```json
{
  "estimated_price": "$450-$500",
  "resale_price": "$550-$650",
  "quick_sale_price": "$400-$450",
  "confidence": "high",
  "reason": "iPhone 13 Pro 屏幕无损伤，电池健康度85%。目前二手市场价格 $550-650，考虑到电池衰减，建议收购价 $450-500。缺少原装配件会降低价值约 5-10%。",
  "done": true
}
```

---

## 🔧 本地开发流程

### 1. 启动开发环境

```bash
npm run dev
```

会同时启动：
- Vite 开发服务器（端口 5173）
- dev-server.js（端口 3001，代理 API）

### 2. 测试流程

1. 打开 `http://localhost:5173`
2. 上传商品图片
3. 观看 Network 标签查看 API 调用
4. 验证响应格式

### 3. 调试技巧

```typescript
// 在 App.tsx 中添加日志
console.log('Messages:', messages)
console.log('API Response:', response)

// 在浏览器 DevTools 中查看
// - Network 标签：请求/响应
// - Console 标签：错误信息
// - Storage 标签：本地存储
```

---

## 🚀 构建与部署流程

### 本地构建

```bash
npm run build
```

输出：
- `dist/` - 前端构建结果
- API 文件自动转换为 Vercel Functions

### Vercel 部署

1. **自动检测配置**
   - `vercel.json` 定义构建和输出目录
   - 框架自动设置为 Vite

2. **环境变量**
   - Vercel Dashboard 添加 `KIMI_API_KEY`

3. **自动部署**
   - 推送到 GitHub
   - Vercel 自动构建和部署

4. **API 部署**
   - `/api/*.js` 文件自动变成 Vercel Serverless Functions
   - URL 自动映射：`/api/identify` → `https://your-domain.vercel.app/api/identify`

---

## 📈 性能指标

| 指标 | 目标 | 当前 |
|-----|------|------|
| 首屏加载 | < 2s | ~1.5s |
| API 响应 | < 5s | ~2-3s |
| 图片识别 | < 10s | ~5-8s |
| 对话响应 | < 5s | ~2-4s |

---

## 🔐 安全考虑

### API Key 保护
- ✅ 只在后端存储（`.env`）
- ✅ 不暴露到前端代码
- ✅ Vercel 环境变量加密存储

### 请求验证
- ✅ 方法检查（POST only）
- ✅ 参数验证（非空检查）
- ✅ 大小限制（图片 ≤ 10MB）

### 错误处理
- ✅ 不暴露内部错误信息
- ✅ 通用错误提示给用户
- ✅ 服务器日志记录详细错误

---

## 📚 相关资源

- [Moonshot API 文档](https://platform.moonshot.cn/docs)
- [Vite 文档](https://vite.dev)
- [React 文档](https://react.dev)
- [Vercel 部署指南](https://vercel.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
