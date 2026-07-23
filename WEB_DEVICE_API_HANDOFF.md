# 小车、鱼缸、盆栽 Web API 对接说明

> 给 Web/后端同学的联调版本。基础地址统一写作 `http://<后端电脑局域网IP>:3000`，JSON 使用 UTF-8。ESP32 与后端电脑必须在同一局域网，设备端不能把 `localhost` 当作服务器地址。

## 0. 先看实现状态

| 模块 | 当前状态 | Web 端结论 |
|---|---|---|
| 小车 | ESP32 已调用 3 个 `/api/car/*` 接口，但当前 desk 后端尚未实现这些路由 | 后端需按本文补齐；前端使用查询与下发接口 |
| 盆栽 | `/api/sensors*` 已在 Node 后端实现，ESP32 已定时上传 | 状态/历史可直接接；浇水、补光等专用命令路由仍需补充 |
| 鱼缸 | 当前只有设备内部 MCP 工具，没有 HTTP 上传或轮询 | Web 接口均为待实现协议，需同时改后端和鱼缸固件 |

## 小程序功能设计

小程序建议做一个“设备总览”入口和三个设备详情页。

| 页面 | 展示 | 可执行操作 |
|---|---|---|
| 设备总览 | 三台设备在线/离线、最后通信时间、关键摘要、异常角标 | 进入详情、手动刷新 |
| 小车 | 工作状态、位姿、目标点、定位质量、雷达图 | 前往坐标、停止、暂停、恢复 |
| 盆栽 | 土壤湿度、温湿度、光照、水箱、水泵、补光灯、趋势图 | 浇水、停止浇水、自动养护、目标湿度、补光灯 |
| 鱼缸 | 水温、pH、浊度、加热棒、警报、趋势图 | 喂食、设置加热目标、开关警报 |
| 命令记录 | 操作内容、提交时间、执行状态、失败原因 | 失败命令重试（喂食命令不建议自动重试） |

设备总览建议由 Web 后端聚合，增加 `GET /api/device/overview?userId=4001`，避免小程序首页连续请求多个接口。建议 `data`：

```json
{
  "car": { "deviceId": "smart-car-01", "online": true, "state": "idle", "lastSeen": "2026-07-16T10:30:00.000Z" },
  "plant": { "deviceId": "smart-plant-esp32s3", "online": true, "soilMoisture": 43, "tankLow": false, "lastSeen": "2026-07-16T10:30:00.000Z" },
  "fishTank": { "deviceId": "smart-fishtank-01", "online": true, "temperature": 25.6, "ph": 7.2, "lastSeen": "2026-07-16T10:30:00.000Z" }
}
```

## Desk 风格通用约定

成功响应统一为：

```json
{ "code": 200, "msg": "success", "data": {} }
```

失败响应统一为：

```json
{ "code": 400, "msg": "参数错误", "data": null }
```

与现有 desk 后端保持一致：业务状态放在 `code`，数据放在 `data`，分页接口额外返回 `page/size/total/pages`。设备轮询命令时，有命令放在 `data`；没有命令返回 `data: null`。错误必须返回 JSON，不返回 HTML。

命令对象统一字段：

```json
{
  "id": "命令UUID",
  "deviceId": "设备ID",
  "command": "命令名",
  "value": {},
  "status": "pending",
  "createTime": "2026-07-16T10:30:00.000Z",
  "updateTime": null,
  "message": null
}
```

状态统一使用 `pending`、`executing`、`completed`、`failed`。小程序提交命令后不能直接提示“执行成功”，只能提示“已下发”；设备 ACK 为 `completed` 后才显示成功。

---

## 1. 小车 API

默认车辆 ID：`smart-car-01`。

### 1.1 设备上传状态（后端待实现，ESP32 已调用）

`POST /api/car/state`

```json
{
  "carId": "smart-car-01",
  "state": "idle",
  "poseValid": false,
  "pose": { "x": 0.0, "y": 0.0, "yaw": 0.0 },
  "goal": { "valid": false, "x": 0.0, "y": 0.0, "yaw": 0.0 },
  "localizationQuality": 0.0,
  "mapVersion": 0,
  "scanSequence": 12
}
```

- `x/y` 单位为米，`yaw` 单位为弧度、逆时针为正。
- `poseValid=false` 时，Web 不应把位姿显示为可靠定位结果。
- `state` 当前可能为 `legacy_course`、`idle`、`stopped_remote`、`paused`、`goal_waiting_for_navigation`；前端应兼容未知新值。
- ESP32 默认每 2 秒上传一次。超过 10 秒没有上报，Web 可显示离线。

成功返回：`200` 或 `201`。

```json
{ "code": 200, "msg": "车辆状态上传成功", "data": { "receivedAt": "2026-07-16T10:30:00.000Z" } }
```

### 1.2 设备上传雷达（后端待实现，ESP32 已调用）

`POST /api/car/scan`

```json
{
  "carId": "smart-car-01",
  "scanSequence": 12,
  "distances": [820, 818, 0, 815]
}
```

实际 `distances` 必须正好有 360 个整数，下标为角度，单位毫米，合法范围建议 `0..12000`，`0` 表示无效点。当前雷达角度中 `180°` 是车头、`90°` 是左侧、`270°` 是右侧。ESP32 默认每秒上传一次。

### 1.3 设备拉取下一条命令（后端待实现，ESP32 已调用）

`GET /api/car/commands/next?carId=smart-car-01`

有命令时（desk 响应外层，命令放在 `data`）：

```json
{ "code": 200, "msg": "success", "data": { "id": "cmd-1024", "deviceId": "smart-car-01", "command": "goto", "value": { "x": 4.0, "y": 3.5, "yaw": 0.0 }, "status": "pending" } }
```

`command` 支持 `goto`、`stop`、`pause`、`resume`。无命令时返回：

```json
{ "code": 200, "msg": "success", "data": null }
```

不要返回 `204` 或重复返回已投递命令。ESP32 每秒轮询，接口最好在 500 ms 内完成。小车固件需要同步改为读取 `data.command` 和 `data.value`；在固件改完前，联调时仍需兼容旧的顶层 `type/x/y/yaw` 格式。

### 1.4 Web 端需要的接口（后端待实现）

- `POST /api/device/control`：按 desk 风格统一下发命令。

```json
{ "deviceId": "smart-car-01", "command": "goto", "value": { "x": 4.0, "y": 3.5, "yaw": 0.0 } }
```

- `GET /api/car/state?carId=smart-car-01`：查询最新状态。
- `GET /api/car/scan/latest?carId=smart-car-01`：查询最新 360 点雷达数据。
- `GET /api/cars`：车辆列表、在线状态、最后上报时间。

下发 `stop` 应取消该车尚未执行的 `goto/resume`；新 `goto` 应替换尚未执行的旧 `goto`。

---

## 2. 盆栽 API

当前固件固定使用：`userId=4001`，`deviceId=smart-plant-esp32s3`。

### 2.1 设备上传传感器数据（已实现）

`POST /api/sensors`

```json
{
  "userId": 4001,
  "deviceId": "smart-plant-esp32s3",
  "lux": 356.2,
  "temperature": 25.4,
  "humidity": 61.5,
  "soilMoisture": 43,
  "climateValid": true,
  "tankLow": false,
  "pumpOn": false,
  "growLightOn": true,
  "createTime": "2026-07-16 18:30:00"
}
```

只有 `userId`、`deviceId` 是后端必填；其余测量值无效时可能为 `null`。布尔字段含义：`climateValid` 温湿度数据有效、`tankLow` 水箱缺水、`pumpOn` 水泵运行、`growLightOn` 补光灯开启。

### 2.2 Web 查询最新数据（已实现）

`GET /api/sensors/latest?userId=4001&deviceId=smart-plant-esp32s3`

成功响应的 `data` 就是上面的传感器对象。没有记录时返回 `404`。

### 2.3 Web 查询历史数据（已实现）

`GET /api/sensors?userId=4001&deviceId=smart-plant-esp32s3&page=1&size=20`

```json
{
  "code": 200,
  "msg": "success",
  "data": [],
  "page": 1,
  "size": 20,
  "total": 0,
  "pages": 0
}
```

`userId` 必填，`deviceId` 可选；按 `createTime` 倒序。

### 2.4 Web 查询当天统计（已实现）

`GET /api/sensors/stat?userId=4001&date=2026-07-16`

`date` 可省略，省略时统计服务器当天。返回：记录数，平均光照/温度/湿度/土壤湿度，最新水箱/水泵/补光灯状态，以及最大/最小光照。

### 2.5 Web 控制盆栽（建议新增，当前不能端到端工作）

现有通用 `/api/device/control` 只接受 `set_brightness`、`set_color`、`beep`、`reset`、`reboot`，不支持浇水和补光；盆栽固件也没有轮询命令。因此建议新增：

`POST /api/device/control`

浇水：

```json
{ "deviceId": "smart-plant-esp32s3", "command": "water", "value": { "seconds": 5 } }
```

其他命令：

```json
{ "deviceId": "smart-plant-esp32s3", "command": "stop_watering", "value": null }
{ "deviceId": "smart-plant-esp32s3", "command": "set_auto_care", "value": { "enabled": true } }
{ "deviceId": "smart-plant-esp32s3", "command": "set_moisture_target", "value": { "percent": 45 } }
{ "deviceId": "smart-plant-esp32s3", "command": "set_grow_light", "value": { "enabled": true } }
```

约束：`seconds` 为 `1..60`（当前默认 5）；`percent` 为 `20..80`；水箱缺水或水泵已经运行时，`water` 应被拒绝。

同时需要固件轮询接口：

`GET /api/device/commands?deviceId=smart-plant-esp32s3`

返回 desk 风格的待执行命令数组；设备每次只取第一条执行。命令执行后更新状态：

`PUT /api/device/commands/{id}`

```json
{ "status": "completed", "message": "watering finished" }
```

---

## 3. 鱼缸 API（以下均为待实现协议）

建议设备 ID：`smart-fishtank-01`。当前鱼缸代码已有温度、pH、浊度、加热棒、喂食器和警报灯控制能力，但尚未通过 HTTP 与 Web 后端连接。

### 3.1 设备上传状态

`POST /api/fishtank/state`

```json
{
  "deviceId": "smart-fishtank-01",
  "temperature": 25.6,
  "ph": 7.2,
  "turbidityNtu": 18.4,
  "heaterOn": false,
  "alertOn": false,
  "createTime": "2026-07-16T10:30:00.000Z"
}
```

### 3.2 Web 查询

- `GET /api/fishtank/state?deviceId=smart-fishtank-01`：最新状态和在线状态。
- `GET /api/fishtank/history?deviceId=smart-fishtank-01&page=1&size=20`：历史水质数据。

### 3.3 Web 下发控制命令

`POST /api/device/control`

喂食（当前固件允许 `1..5` 克）：

```json
{ "deviceId": "smart-fishtank-01", "command": "feed", "value": { "amountG": 1 } }
```

设置加热目标（当前固件允许 `20..30°C`、`1..60` 分钟）：

```json
{ "deviceId": "smart-fishtank-01", "command": "set_heater", "value": { "targetC": 26.0, "maxMinutes": 30 } }
```

设置警报灯：

```json
{ "deviceId": "smart-fishtank-01", "command": "set_alert", "value": { "enabled": true } }
```

### 3.4 设备拉取命令与回执

- `GET /api/device/commands?deviceId=smart-fishtank-01`：读取 `data` 中的待执行命令数组。
- `PUT /api/device/commands/{id}`：执行前更新为 `executing`，完成后更新为 `completed`，异常更新为 `failed` 并填写 `message`。

喂食命令必须防重复消费，后端投递后不能在下次轮询再次返回同一 `commandId`，否则可能重复喂食。

---

## 4. Web 页面最小接入清单

1. 小车页：在线状态、状态文字、位姿、目标点、360° 雷达点云、前往/停止/暂停/恢复。
2. 盆栽页：最新土壤湿度、温湿度、光照、水箱/水泵/补光灯状态、历史曲线；控制按钮等专用命令接口完成后再接。
3. 鱼缸页：最新温度、pH、浊度、加热/警报状态、历史曲线、喂食/加热/警报；需等待 HTTP 链路实现。
4. 所有写操作按钮都应防连点；命令提交后显示 `pending`，收到 ACK 或状态变化后再显示成功。
