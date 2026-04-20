# 快速参考

## 开发命令

```bash
npm run dev      # 启动开发环境（Vite :5173 + API :3001）
npm run build    # 生产构建（tsc + vite build）
npm run preview  # 预览生产构建
npm run lint     # ESLint 检查
```

## 首次设置

```bash
git clone https://github.com/vervegrow-cmyk/Inventory-Liquidity-AI.git
cd Inventory-Liquidity-AI
npm install
echo "KIMI_API_KEY=你的Key" > .env
npm run dev
```

---

## API 路由速查

| 方法 | 路由 | 功能 | 旧路由（兼容）|
|------|------|------|------|
| POST | `/api/identify/analyze` | 商品识别 | `/api/identify` |
| POST | `/api/pricing/calculate` | AI 定价对话 | `/api/chat` |
| POST | `/api/generate/content` | 内容生成 | `/api/generate` |

所有路由统一响应格式：
```json
{ "success": true/false, "data": {} | "error": { "code": "", "message": "" } }
```

## 错误码

| 错误码 | 含义 |
|--------|------|
| `VALIDATION_ERROR` | 入参缺失或格式错误 |
| `UNAUTHORIZED` | 未授权 |
| `NOT_FOUND` | 路由不存在 |
| `INTERNAL_ERROR` | 服务器内部错误 |
| `AI_ERROR` | Kimi API 调用失败 |

---

## 目录速查

```
skills/          AI 原子能力（只调用 Kimi）
agents/          AI 流程编排（调用 skills）
features/        业务模块（controller + service）
backend/         响应工具 + 日志中间件
lib/             后端工具函数

src/types/       TypeScript 类型定义
src/lib/         前端工具函数（utils + media）
src/repositories/ Dexie 数据访问封装
src/services/    API fetch 封装
src/ui/          UI 组件（components + blocks）
src/stores/      Zustand 全局状态
```

## 分层规则（禁止跨层）

```
App.tsx → services/ → HTTP
                         → controller → service → agent → skill → Kimi
store   → repositories/ → db.ts (Dexie)
```

---

## 新增 API 路由步骤

1. `skills/` 添加新能力（或复用现有）
2. `agents/` 添加编排逻辑
3. `features/{module}/service.js` 写业务逻辑
4. `features/{module}/controller.js` 写请求处理
5. `dev-server.js` 的 `ROUTES` 表加入新路由
6. `src/services/` 添加前端 fetch 封装

## 环境变量

| 变量 | 说明 |
|------|------|
| `KIMI_API_KEY` | Moonshot API Key，必填 |

获取：[platform.moonshot.cn](https://platform.moonshot.cn)
