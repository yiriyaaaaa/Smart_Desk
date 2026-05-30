# Smart Desk - 智能学习桌

基于 Vue 3 + Express 的智能学习桌管理系统，配套微信小程序，支持学习数据统计、坐姿监测、设备控制、摄像头画面实时查看等功能。

## 项目结构

```
smart_desk_web/
├── smart_desk_web/        # 前端 - Vue 3 + Vite + Element Plus
├── smart_desk_server/     # 后端 - Express.js API 服务器
└── smart_desk_miniapp/    # 微信小程序
```

## 功能特性

- **学生管理** — 学生信息的增删改查
- **学习数据分析** — 按日/周/月维度的学习时长统计
- **坐姿监测** — 实时坐姿状态检测与记录
- **设备控制** — 智能桌高度、亮度等状态控制
- **摄像头画面** — 支持 ESP32 图片上传与实时画面展示

## 快速开始

### 后端

```bash
cd smart_desk_server
npm install
node app.js
```

服务运行在 `http://localhost:3000`

### 前端

```bash
cd smart_desk_web
npm install
npm run dev
```

### 小程序

使用微信开发者工具打开 `smart_desk_miniapp` 目录即可。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| GET | `/api/users/:id` | 获取用户详情 |
| POST | `/api/users` | 新增用户 |
| PUT | `/api/users/:id` | 修改用户 |
| DELETE | `/api/users/:id` | 删除用户 |
| GET | `/api/study-time` | 学习时长统计 |
| GET | `/api/study-sessions` | 学习记录列表 |
| POST | `/api/study-sessions` | 添加学习记录 |
| GET | `/api/posture` | 获取坐姿状态 |
| POST | `/api/posture` | 上传坐姿状态 |
| GET | `/api/devices` | 获取设备列表 |
| GET | `/api/devices/:id` | 获取设备详情 |
| PUT | `/api/devices/:id` | 更新设备状态 |
| GET | `/api/camera` | 获取摄像头画面 |
| POST | `/api/camera` | 上传图片 (multipart) |
| POST | `/api/camera/base64` | 上传图片 (base64) |
