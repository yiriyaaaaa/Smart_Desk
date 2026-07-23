const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const { sendSuccess, sendError } = require('../utils/helpers');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片文件'));
  }
});

// 获取摄像头画面
router.get('/', async (req, res) => {
  const latestPath = path.join(UPLOAD_DIR, 'camera_latest.jpg');
  if (fs.existsSync(latestPath)) {
    return res.type('image/jpeg').send(fs.readFileSync(latestPath));
  }
  try {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', { hour12: false });
    const statuses = ['学习状态：正常', '学习状态：专注', '学习状态：良好', '学习状态：检测中'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const postureLabels = ['坐姿：标准', '坐姿：轻微前倾', '坐姿：端正', '坐姿：笔直'];
    const posture = postureLabels[Math.floor(Math.random() * postureLabels.length)];

    const svg = `
    <svg width="480" height="320" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f0c29"/>
          <stop offset="50%" style="stop-color:#302b63"/>
          <stop offset="100%" style="stop-color:#24243e"/>
        </linearGradient>
      </defs>
      <rect width="480" height="320" fill="url(#bg)"/>
      <text x="240" y="80" text-anchor="middle" fill="#fff" font-size="22" font-family="sans-serif" font-weight="bold">📷 智能学习桌摄像头</text>
      <text x="240" y="115" text-anchor="middle" fill="#00ff88" font-size="15" font-family="monospace">● 等待上传</text>
      <text x="240" y="160" text-anchor="middle" fill="#888" font-size="14" font-family="sans-serif">暂无实时画面，请等待ESP32上传</text>
      <text x="240" y="190" text-anchor="middle" fill="#888" font-size="14" font-family="sans-serif">${status}</text>
      <text x="240" y="220" text-anchor="middle" fill="#888" font-size="14" font-family="sans-serif">${posture}</text>
      <rect x="0" y="280" width="480" height="40" fill="rgba(0,0,0,0.6)"/>
      <text x="12" y="304" fill="#aaa" font-size="12" font-family="monospace">CAM-01  |  ${timeStr}</text>
      <text x="468" y="304" text-anchor="end" fill="#aaa" font-size="12" font-family="monospace">480×320</text>
    </svg>`;

    const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
    res.type('image/jpeg').send(buffer);
  } catch (err) {
    console.error('摄像头占位图生成失败:', err);
    sendError(res, 500, '摄像头画面生成失败');
  }
});

// ESP32 上传图片（multipart/form-data）
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, '请上传图片文件（字段名: image）');
    const dest = path.join(UPLOAD_DIR, 'camera_latest.jpg');
    const info = await sharp(req.file.buffer)
      .resize(480, 320, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(dest);
    sendSuccess(res, { time: new Date().toISOString(), width: info.width, height: info.height, size: info.size }, '图片上传成功');
  } catch (err) {
    console.error('图片上传处理失败:', err);
    sendError(res, 500, '图片上传处理失败');
  }
});

// ESP32 上传图片（base64）
router.post('/base64', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return sendError(res, 400, '缺少 image 字段（base64字符串）');
    const buffer = Buffer.from(image, 'base64');
    const dest = path.join(UPLOAD_DIR, 'camera_latest.jpg');
    const info = await sharp(buffer)
      .resize(480, 320, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(dest);
    sendSuccess(res, { time: new Date().toISOString(), width: info.width, height: info.height, size: info.size }, '图片上传成功');
  } catch (err) {
    console.error('base64 图片处理失败:', err);
    sendError(res, 500, 'base64 图片处理失败');
  }
});

// 查询最新图片信息
router.get('/info', async (req, res) => {
  const latestPath = path.join(UPLOAD_DIR, 'camera_latest.jpg');
  const exists = fs.existsSync(latestPath);
  sendSuccess(res, {
    hasImage: exists,
    updateTime: exists ? fs.statSync(latestPath).mtime.toISOString() : null,
    size: exists ? fs.statSync(latestPath).size : 0
  });
});

module.exports = router;
