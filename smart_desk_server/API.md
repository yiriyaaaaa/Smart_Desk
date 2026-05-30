# Smart Desk API 接口文档

**基础地址：** `http://localhost:3000`

**通用响应格式：**

```json
{
  "code": 200,        // 状态码（200成功，其他失败）
  "msg": "success",   // 提示信息
  "data": {}          // 返回数据（可能为null）
}
```

**分页接口额外返回字段：**

```json
{
  "code": 200,
  "msg": "success",
  "data": { "list": [], "total": 0 },
  "page": 1,    // 当前页码
  "size": 10,   // 每页条数
  "pages": 1    // 总页数
}
```

---

## 1. 用户管理

### 1.1 获取用户列表

```
GET /api/users?page=1&size=10
```

| 参数 | 类型 | 必填 | 说明           |
| ---- | ---- | ---- | -------------- |
| page | int  | 否   | 页码，默认 1   |
| size | int  | 否   | 每页条数，默认 10 |

### 1.2 获取单个用户详情

```
GET /api/users/:id
```

| 参数 | 类型 | 必填 | 说明   |
| ---- | ---- | ---- | ------ |
| id   | int  | 是   | 用户ID |

### 1.3 新增用户

```
POST /api/users
Content-Type: application/json
```

**请求体：**

```json
{
  "name": "张三",
  "class": "三年二班"
}
```

| 参数  | 类型   | 必填 | 说明     |
| ----- | ------ | ---- | -------- |
| name  | string | 是   | 用户姓名 |
| class | string | 是   | 班级     |

### 1.4 修改用户

```
PUT /api/users/:id
Content-Type: application/json
```

**请求体：**

```json
{
  "name": "李四",
  "class": "四年一班"
}
```

| 参数  | 类型   | 必填 | 说明               |
| ----- | ------ | ---- | ------------------ |
| name  | string | 否   | 用户姓名（可选更新） |
| class | string | 否   | 班级（可选更新）     |

### 1.5 删除用户

```
DELETE /api/users/:id
```

| 参数 | 类型 | 必填 | 说明   |
| ---- | ---- | ---- | ------ |
| id   | int  | 是   | 用户ID |

---

## 2. 学习记录

### 2.1 获取学习时长统计

```
GET /api/study-time?userId=1001&from=2024-01-01&to=2024-12-31&granularity=day
```

| 参数        | 类型   | 必填 | 说明                                           |
| ----------- | ------ | ---- | ---------------------------------------------- |
| userId      | int    | 是   | 用户ID                                         |
| from        | string | 否   | 开始时间                                       |
| to          | string | 否   | 结束时间                                       |
| granularity | string | 否   | 聚合维度：`day`（日）、`week`（周）、`month`（月），默认 `day` |

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "totalDuration": 120,
    "daily": {
      "2024-01-01": 60,
      "2024-01-02": 60
    }
  }
}
```

### 2.2 添加学习记录

```
POST /api/study-sessions
Content-Type: application/json
```

**请求体：**

```json
{
  "userId": 1001,
  "startTime": "2024-01-01 08:00:00",
  "endTime": "2024-01-01 10:00:00"
}
```

| 参数      | 类型   | 必填 | 说明               |
| --------- | ------ | ---- | ------------------ |
| userId    | int    | 是   | 用户ID             |
| startTime | string | 是   | 开始时间           |
| endTime   | string | 是   | 结束时间           |

- `duration`（时长）由服务端自动计算，单位为分钟。
- `recordId` 由服务端自动生成 UUID。

### 2.3 获取学习记录列表

```
GET /api/study-sessions?page=1&size=10&userId=1001
```

| 参数   | 类型 | 必填 | 说明             |
| ------ | ---- | ---- | ---------------- |
| page   | int  | 否   | 页码，默认 1     |
| size   | int  | 否   | 每页条数，默认 10 |
| userId | int  | 否   | 按用户ID筛选     |

每条记录会自动拼接 `userName` 字段。

### 2.4 获取单个用户学习记录（按用户ID分页）

```
GET /api/study-sessions/user?userId=1001&page=1&size=10
```

| 参数   | 类型 | 必填 | 说明             |
| ------ | ---- | ---- | ---------------- |
| userId | int  | 是   | 用户ID           |
| page   | int  | 否   | 页码，默认 1     |
| size   | int  | 否   | 每页条数，默认 10 |

---

## 3. 坐姿状态

### 3.1 获取当前坐姿状态（最近一条记录）

```
GET /api/posture?userId=1001
```

| 参数   | 类型 | 必填 | 说明   |
| ------ | ---- | ---- | ------ |
| userId | int  | 是   | 用户ID |

### 3.2 上传/更新坐姿状态

```
POST /api/posture
Content-Type: application/json
```

**请求体：**

```json
{
  "userId": 1001,
  "postureStatus": "端正",
  "createTime": "2024-01-01 08:00:00"
}
```

| 参数          | 类型   | 必填 | 说明             |
| ------------- | ------ | ---- | ---------------- |
| userId        | int    | 是   | 用户ID           |
| postureStatus | string | 是   | 坐姿状态         |
| createTime    | string | 是   | 记录时间         |

> 同一个 `userId` 会覆盖更新；不同 `userId` 则新增记录。

---

## 4. 设备管理

### 4.1 获取设备列表

```
GET /api/devices?page=1&size=10
```

| 参数 | 类型 | 必填 | 说明             |
| ---- | ---- | ---- | ---------------- |
| page | int  | 否   | 页码，默认 1     |
| size | int  | 否   | 每页条数，默认 10 |

### 4.2 获取单个设备详情

```
GET /api/devices/:id
```

| 参数 | 类型   | 必填 | 说明   |
| ---- | ------ | ---- | ------ |
| id   | string | 是   | 设备ID |

### 4.3 上传/更新设备状态

```
PUT /api/devices/:id
Content-Type: application/json
```

**请求体：**

```json
{
  "id": "DESK-001",
  "status": "online",
  "height": 75,
  "light": 80
}
```

| 参数   | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| id     | string | 是   | 设备ID       |
| status | string | 是   | 设备状态     |
| height | int    | 是   | 桌面高度（cm） |
| light  | int    | 是   | 灯光亮度     |

> 要求路径中的 `:id` 与请求体中的 `id` 一致。同 `id` 覆盖更新，不同 `id` 新增记录。

---

## 5. 摄像头

### 5.1 获取摄像头画面

```
GET /api/camera
```

返回 `image/jpeg` 格式图片。若 ESP32 已上传图片则返回最新图片；否则返回 SVG 生成的占位图（含时间、学习状态、坐姿信息）。

### 5.2 上传图片（multipart/form-data）

```
POST /api/camera
Content-Type: multipart/form-data
```

| 字段  | 类型   | 必填 | 说明           |
| ----- | ------ | ---- | -------------- |
| image | File   | 是   | 图片文件，字段名为 `image` |

- 图片会自动调整为 480×320 以内，JPEG 格式 85% 质量保存。

**响应示例：**

```json
{
  "code": 200,
  "msg": "图片上传成功",
  "data": {
    "time": "2024-01-01T08:00:00.000Z",
    "width": 480,
    "height": 320,
    "size": 12345
  }
}
```

### 5.3 上传图片（Base64 JSON）

```
POST /api/camera/base64
Content-Type: application/json
```

**请求体：**

```json
{
  "image": "/9j/4AAQ..."   // Base64 编码的图片数据
}
```

| 字段  | 类型   | 必填 | 说明               |
| ----- | ------ | ---- | ------------------ |
| image | string | 是   | Base64 编码的图片字符串 |

**响应：** 同上。

### 5.4 查询最新图片信息

```
GET /api/camera/info
```

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "hasImage": true,
    "updateTime": "2024-01-01T08:00:00.000Z",
    "size": 12345
  }
}
```

---

## 附录：数据文件结构（data.json）

```json
{
  "users": [
    {
      "id": 1001,
      "name": "张三",
      "class": "三年二班"
    }
  ],
  "study_sessions": [
    {
      "recordId": "uuid-string",
      "userId": 1001,
      "startTime": "2024-01-01 08:00:00",
      "endTime": "2024-01-01 10:00:00",
      "duration": 120
    }
  ],
  "devices": [
    {
      "id": "DESK-001",
      "status": "online",
      "height": 75,
      "light": 80
    }
  ],
  "posture": [
    {
      "userId": 1001,
      "postureStatus": "端正",
      "createTime": "2024-01-01 08:00:00"
    }
  ]
}
```

---

## 错误码说明

| code | 说明         |
| ---- | ------------ |
| 200  | 请求成功     |
| 400  | 参数错误     |
| 404  | 资源未找到   |
| 500  | 服务器内部错误 |
