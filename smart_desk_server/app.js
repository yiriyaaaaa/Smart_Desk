const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 原有模块
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/study'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/posture', require('./routes/posture'));
app.use('/api/camera', require('./routes/camera'));

// 小车
app.use('/api/car', require('./routes/car'));
app.use('/api/cars', require('./routes/car'));

// 植栽传感器
app.use('/api/sensors', require('./routes/sensors'));

// 鱼缸
app.use('/api/fishtank', require('./routes/fishtank'));

// 统一设备控制/命令/总览
app.use('/api/device', require('./routes/deviceControl'));

app.use((err, req, res, next) => {
  console.error('服务器异常：', err.stack);
  res.json({ code: 500, msg: '服务器内部错误', data: null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务器已启动：http://localhost:${PORT}`);
  console.log(`数据文件位置：${path.join(__dirname, 'data.json')}`);
});
