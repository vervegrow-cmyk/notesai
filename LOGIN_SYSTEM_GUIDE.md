# 后端登录和管理系统指南

## 功能概述

### 1. 认证系统
- **登录页面**：管理员必须先登录才能访问系统
- **默认账户**：
  - 用户名：`admin`
  - 密码：`123456`

### 2. API 端点

#### 认证 API
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/verify` - 验证token

#### 询价管理 API
- `POST /api/inquiry/list` - 获取所有询价（支持按状态筛选）
- `POST /api/inquiry/get` - 获取单个询价详情
- `POST /api/inquiry/save` - 保存或创建询价
- `POST /api/inquiry/update-status` - 更新询价状态
- `POST /api/inquiry/update` - 更新询价信息
- `POST /api/inquiry/delete` - 删除询价
- `POST /api/inquiry/statistics` - 获取统计数据

## 使用流程

### 步骤 1：启动开发服务器
```bash
npm run dev
```

这会同时启动：
- 前端开发服务器（Vite）：`http://localhost:5173`
- 后端 API 服务器：`http://localhost:3001`

### 步骤 2：访问应用
1. 打开浏览器访问 `http://localhost:5173`
2. 在登录页面输入凭证：
   - 用户名：`admin`
   - 密码：`123456`
3. 点击"登录"按钮

### 步骤 3：管理询价
1. 登录成功后，点击顶部导航中的"🏢 后台"按钮
2. 进入管理面板，你将看到：
   - **统计卡片**：显示询价统计数据
   - **状态筛选**：按状态（全部/新询价/已联系/已成交）筛选
   - **询价列表**：显示所有询价记录

### 步骤 4：处理询价
1. 点击任何询价的"查看"按钮进入详情页面
2. 查看客户信息、商品列表和估价明细
3. 使用"标记已联系"或"标记成交"按钮更新状态
4. 返回列表查看更新后的状态

## 询价数据结构

```typescript
interface Inquiry {
  id: string;                           // 唯一ID
  products: InquiryProduct[];           // 商品列表
  userName: string;                     // 用户名
  contact: string;                      // 联系方式
  method: 'pickup' | 'shipping';        // 回收方式
  pickupInfo?: InquiryPickupInfo;       // 上门信息（可选）
  shippingAddress?: string;             // 邮寄地址（可选）
  estimatedTotal: number;               // 总估价
  status: 'new' | 'contacted' | 'dealed'; // 状态
  createdAt: string;                    // 创建时间
}
```

## 前端文件结构

### 新建文件
- `src/modules/auth/LoginPage.tsx` - 登录页面
- `src/modules/admin/AdminDashboard.tsx` - 管理面板主页
- `src/stores/authStore.ts` - 认证状态管理（Zustand）
- `src/services/authApi.ts` - 认证 API 服务
- `src/services/inquiryApi.ts` - 询价管理 API 服务

### 修改文件
- `src/App.tsx` - 添加认证检查和管理面板集成
- `src/modules/admin/InquiryDetailPage.tsx` - 添加API调用支持

## 后端文件结构

### 新建目录和文件
```
features/
├── auth/
│   ├── controller.js         # 认证控制器
│   └── service.js            # 认证服务
└── inquiry/
    ├── controller.js         # 询价管理控制器
    └── service.js            # 询价管理服务
```

### 修改文件
- `dev-server.js` - 添加新的API路由

## 特性说明

### 认证系统
- 基于token的无状态认证
- Token有效期：24小时
- 登录信息自动保存到localStorage（刷新页面后保持登录）

### 数据存储
- 当前使用内存存储（内存中的Map）
- **生产环境建议**：集成数据库（MongoDB、PostgreSQL等）

### 询价管理
- 支持三种状态：新询价、已联系、已成交
- 支持按状态筛选和搜索
- 显示统计数据（总数、按状态分类、总估值）
- 支持查看详情和更新状态

## 后续改进建议

1. **数据持久化**
   - 集成MongoDB或PostgreSQL数据库
   - 实现数据备份和恢复

2. **安全增强**
   - 使用JWT token替代简单token
   - 实现密码加密存储
   - 添加请求签名验证

3. **功能扩展**
   - 导出询价数据为Excel
   - 发送邮件通知
   - 添加用户权限管理
   - 实现审计日志

4. **界面优化**
   - 添加高级搜索和筛选
   - 批量操作功能
   - 数据导入/导出
   - 可视化统计图表

## 测试

### 测试登录
```bash
# 测试使用默认账户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### 测试询价列表
```bash
curl -X POST http://localhost:3001/api/inquiry/list \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 测试创建询价
```bash
curl -X POST http://localhost:3001/api/inquiry/save \
  -H "Content-Type: application/json" \
  -d '{
    "userName":"张三",
    "contact":"13800138000",
    "method":"pickup",
    "products":[{"name":"iPhone 12","category":"手机","brand":"Apple"}],
    "estimatedTotal":5000,
    "pickupInfo":{"address":"北京市朝阳区"}
  }'
```

## 问题排查

### 登录失败
- 检查后端服务是否运行：`http://localhost:3001/api/auth/login`
- 验证用户名和密码：默认为 `admin` / `123456`

### 查看不到询价
- 确保已登录并进入管理面板
- 检查浏览器控制台是否有错误信息
- 验证后端服务是否正常运行

### 更新状态失败
- 检查网络连接
- 确认后端服务在运行
- 查看浏览器控制台的错误信息

## 联系和支持

如有问题或需要帮助，请查看项目的其他文档或联系开发团队。
