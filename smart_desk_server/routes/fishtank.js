const express = require('express');
const router = express.Router();
const { readData, writeData, sendSuccess, sendError, validatePageParams } = require('../utils/helpers');

// 3.1 设备上传状态
router.post('/state', async (req, res) => {
  const { deviceId, temperature, ph, turbidityNtu, heaterOn, alertOn, createTime } = req.body;
  if (!deviceId) return sendError(res, 400, 'deviceId 为必传参数');

  const data = await readData();
  if (!data.fishtank) data.fishtank = [];

  const entry = {
    deviceId,
    temperature: temperature ?? null,
    ph: ph ?? null,
    turbidityNtu: turbidityNtu ?? null,
    heaterOn: !!heaterOn,
    alertOn: !!alertOn,
    createTime: createTime || new Date().toISOString()
  };
  data.fishtank.push(entry);
  if (data.fishtank.length > 10000) data.fishtank = data.fishtank.slice(-10000);

  if (await writeData(data)) {
    sendSuccess(res, { receivedAt: new Date().toISOString() }, '鱼缸状态上传成功');
  } else {
    sendError(res, 500, '保存失败');
  }
});

// 3.2 Web 查询最新状态
router.get('/state', async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return sendError(res, 400, 'deviceId 为必传参数');

  const data = await readData();
  const records = (data.fishtank || []).filter(r => r.deviceId === deviceId);
  if (records.length === 0) return sendError(res, 404, '未找到鱼缸状态');

  records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  const latest = records[0];
  const now = Date.now();
  latest.online = (now - new Date(latest.createTime).getTime()) < 30000;

  sendSuccess(res, latest);
});

// 3.2 Web 查询历史数据
router.get('/history', async (req, res) => {
  const { deviceId, page = 1, size = 20 } = req.query;
  if (!deviceId) return sendError(res, 400, 'deviceId 为必传参数');
  const { pageNum, pageSize } = validatePageParams(page, size);

  const data = await readData();
  let records = (data.fishtank || []).filter(r => r.deviceId === deviceId);
  records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  const total = records.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;

  res.json({
    code: 200, msg: 'success',
    data: records.slice(start, end),
    page: pageNum, size: pageSize, total, pages: Math.ceil(total / pageSize)
  });
});

// 获取所有鱼缸设备最新状态列表
router.get('/', async (req, res) => {
  const data = await readData();
  const records = data.fishtank || [];
  const now = Date.now();

  const map = {};
  records.forEach(r => {
    if (!map[r.deviceId] || new Date(r.createTime) > new Date(map[r.deviceId].createTime)) {
      map[r.deviceId] = r;
    }
  });

  const list = Object.values(map).map(r => ({
    deviceId: r.deviceId,
    temperature: r.temperature,
    ph: r.ph,
    turbidityNtu: r.turbidityNtu,
    heaterOn: r.heaterOn,
    alertOn: r.alertOn,
    createTime: r.createTime,
    online: (now - new Date(r.createTime).getTime()) < 30000
  }));

  sendSuccess(res, { list, total: list.length });
});

module.exports = router;
