# 技术架构文档

## 架构概览

本项目采用严格分层架构，前后端职责清晰，AI 能力插件化。

```
┌─────────────────────────────────────────┐
│               前端 (React + Vite)        │
│  App.tsx → services → fetch → API 路由  │
└─────────────────┬───────────────────────┘
                  │ HTTP POST
┌─────────────────▼───────────────────────┐
│           dev-server.js (Node.js)        │
│         路由分发 → controller            │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────▼──────────────┐
    │  features/{module}/        │
    │  controller → service      │
    └─────────────┬──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │  agents/                   │
    │  流程编排（retry、多轮）    │
    └─────────────┬──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │  skills/                   │
    │  单一 AI 能力（原子调用）   │
    └─────────────┬──────────────┘
                  │ HTTPS
    ┌─────────────▼──────────────┐
    │  Kimi API (Moonshot)        │
    │  moonshot-v1-8k / vision    │
    └────────────────────────────┘
```

---

## 后端层级详解

### skills/ — AI 能力原子层

每个 skill 只做一件事，不包含业务逻辑。

| 文件 | 职责 |
|------|------|
| `kimiClient.js` | 对 Kimi API 的原始 HTTP 调用，返回文本 |
| `kimiVision.js` | 图像识别 / 文本识别，返回标准化商品对象 |
| `kimiGenerate.js` | 自由生成，直接返回文本 |

**规则：**
- 不访问数据库
- 不包含业务逻辑
- 不感知业务上下文（谁在调用、为什么调用）

### agents/ — 流程编排层

Agent 负责将多个 skill 组合成完整流程，处理重试、分支判断。

| 文件 | 流程 |
|------|------|
| `pricingAgent.js` | 调用 kimiClient → 解析 JSON → 失败则 retry（最多 1 次）|
| `identifyAgent.js` | 根据输入类型分发：image → kimiVisionIdentify，text → kimiTextIdentify |

**规则：**
- 不写具体业务逻辑
- 不直接响应 HTTP 请求
- 只调用 skill，协调流程

### features/ — 业务模块层

每个模块包含 `controller.js` + `service.js`。

```
features/pricing/
  controller.js   ← 请求校验 + 调用 service + 返回标准响应
  service.js      ← 业务逻辑（目前薄层，直接委托 agent）

features/identify/
  controller.js
  service.js

features/generate/
  controller.js
  service.js
```

**controller 职责：**
1. 校验入参（缺失则返回 `VALIDATION_ERROR`）
2. 调用 service
3. 捕获异常返回 `AI_ERROR`
4. 返回统一格式 `{ success, data }` 或 `{ success, error }`

**service 职责：**
- 业务逻辑聚合点
- 不直接操作数据库、不直接调用 AI
- 只调用 agent 或 repository

### backend/api-core/ — 响应标准层

```js
// response.js
success(data, message?)   // → { success: true, data, message }
fail(code, message)       // → { success: false, error: { code, message } }

// errors.js
ErrorCode.VALIDATION_ERROR
ErrorCode.UNAUTHORIZED
ErrorCode.NOT_FOUND
ErrorCode.INTERNAL_ERROR
ErrorCode.AI_ERROR
```

### dev-server.js — HTTP 服务器

纯路由分发，不含业务逻辑。

```
请求 → 读取 body → 查路由表 → 调用 controller → send 响应
```

路由表：

| 新路由 | 别名（旧路由）| Controller |
|--------|------------|------------|
| `/api/pricing/calculate` | `/api/chat` | pricingController |
| `/api/identify/analyze` | `/api/identify` | identifyController |
| `/api/generate/content` | `/api/generate` | generateController |

---

## 前端层级详解

### src/types/index.ts — 全局类型

所有跨层共享的类型定义集中在此，包含：
- 领域类型：`Folder`、`Note`、`Product`、`SpreadsheetProduct`、`ChatMessage`、`PricingResult`
- UI 类型：`Phase`、`FileType`
- API 信封类型：`ApiSuccess<T>`、`ApiError`、`ApiResponse<T>`

### src/lib/ — 工具函数

| 文件 | 函数 |
|------|------|
| `utils.ts` | `parseJson`（健壮 JSON 解析）、`findByKeywords`（表头关键词匹配）|
| `media.ts` | `extractVideoFrame`、`parseSpreadsheet`、`extractExcelImages`、`extractProducts` |

规则：纯函数，无副作用，不调用 API，不访问 DOM（除 media.ts 的 canvas/video）。

### src/repositories/ — 数据访问层

封装 Dexie（IndexedDB）操作，上层（store）只调用 repo 函数，不直接操作 `db`。

```
notesStore → inventoryRepo.findAllNotes() → db.notes.orderBy(...)
notesStore → folderRepo.deleteFolder(id) → db.folders.delete(id)
```

### src/services/ — API 调用封装

客户端 fetch 封装，负责：
1. 构造请求 body
2. 发送 POST 请求
3. 解包响应信封（`json.data`）
4. 将 API 错误转换为 JS Error

```ts
// App.tsx 只需关心业务数据，不处理 HTTP 细节
const result = await callPricingApi(messages);
if (result.done) { /* 估价完成 */ }
```

### src/ui/ — UI 组件

| 层级 | 位置 | 说明 |
|------|------|------|
| 原子组件 | `ui/components/PriceCard.tsx` | 无副作用，纯展示 |
| 页面块 | `ui/blocks/ChatPanel.tsx` | 含内部 ref/effect，接受 props |

**规则：** UI 只负责展示，不调用 API，不包含业务逻辑。

### src/App.tsx — 应用主控

职责范围：
- 管理应用阶段状态（`Phase`）
- 调用 `lib/media.ts` 处理文件
- 调用 `services/` 发起 AI 请求
- 将状态和回调传递给 UI 块

---

## 完整调用流程示例（图片估价）

```
1. 用户上传图片
   App.tsx → handleFileChange()
   → lib/media.ts: 无需处理（FileReader 读取）
   → setImageBase64(base64)

2. 点击 "Start Valuation"
   App.tsx → handleStartValuation()
   → services/identifyApi.ts: callIdentifyApi({ image: base64 })
   → POST /api/identify/analyze
   → features/identify/controller.js: 校验 body.image
   → features/identify/service.js: analyzeProduct()
   → agents/identifyAgent.js: identifyProduct({ image })
   → skills/kimiVision.js: kimiVisionIdentify(base64)
   → skills/kimiClient.js: kimiChat({ model: 'moonshot-v1-8k-vision-preview', ... })
   → Kimi API → 返回 JSON
   → 逐层解包 → { name, category, brand }
   → frontend: setProduct(identified)

3. 进入定价对话
   → services/pricingApi.ts: callPricingApi(messages)
   → POST /api/pricing/calculate
   → agents/pricingAgent.js: runPricingTurn(messages)
   → 返回 { question, done: false }
   → ChatPanel 显示问题

4. 用户回答，重复第 3 步（最多 5 轮）
   → 最终返回 { estimated_price, resale_price, quick_sale_price, done: true }
   → App.tsx: setResult(data), setPhase('done')
```

---

## 数据流（笔记模块）

```
用户操作
  → useNotesStore (Zustand)
    → repositories/inventoryRepo.ts
    → repositories/folderRepo.ts
      → services/db.ts (Dexie instance)
        → IndexedDB (浏览器本地存储)
```

---

## 技术选型说明

| 决策 | 选择 | 原因 |
|------|------|------|
| 前端框架 | React 19 + Vite 8 | 快速热更新，生态成熟 |
| 样式 | Tailwind CSS v4 | 零运行时，原子类 |
| 本地存储 | Dexie (IndexedDB) | 客户端离线数据，无需服务端 DB |
| 状态管理 | Zustand | 轻量，无 boilerplate |
| AI 服务 | Kimi (Moonshot) | 支持中文场景，有 vision 能力 |
| API 服务 | Node.js HTTP（原生）| 无框架依赖，轻量 |
