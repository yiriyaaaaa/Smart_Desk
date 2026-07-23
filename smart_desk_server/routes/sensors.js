const express = require('express');
const router = express.Router();
const { readData, writeData, sendSuccess, sendError, validatePageParams } = require('../utils/helpers');

router.post('/', async (req, res) => {
  const { userId, deviceId, lux, temperature, humidity, soilMoisture, climateValid, tankLow, pumpOn, growLightOn, createTime } = req.body;
  if (!userId || !deviceId) return sendError(res, 400, 'userId 和 deviceId 为必传参数');

  const data = await readData();
  if (!data.sensors) data.sensors = [];
  const entry = {
    id: data.sensors.length + 1,
    userId, deviceId,
    lux: lux ?? null, temperature: temperature ?? null, humidity: humidity ?? null,
    soilMoisture: soilMoisture ?? null,
    climateValid: !!climateValid, tankLow: !!tankLow, pumpOn: !!pumpOn, growLightOn: !!growLightOn,
    createTime: createTime || new Date().toISOString()
  };
  data.sensors.push(entry);
  if (data.sensors.length > 10000) data.sensors = data.sensors.slice(-10000);

  if (await writeData(data)) {
    sendSuccess(res, entry, '传感器数据上传成功');
  } else {
    sendError(res, 500, '保存失败');
  }
});

router.get('/latest', async (req, res) => {
  const { userId, deviceId } = req.query;
  if (!userId) return sendError(res, 400, 'userId 为必传参数');
  const data = await readData();
  let records = data.sensors || [];
  records = records.filter(r => r.userId == userId);
  if (deviceId) records = records.filter(r => r.deviceId === deviceId);
  if (records.length === 0) return sendError(res, 404, '未找到传感器记录');
  records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  sendSuccess(res, records[0]);
});

router.get('/', async (req, res) => {
  const { userId, deviceId, page = 1, size = 20 } = req.query;
  if (!userId) return sendError(res, 400, 'userId 为必传参数');
  const { pageNum, pageSize } = validatePageParams(page, size);

  const data = await readData();
  let records = data.sensors || [];
  records = records.filter(r => r.userId == userId);
  if (deviceId) records = records.filter(r => r.deviceId === deviceId);
  records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  const total = records.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  res.json({ code: 200, msg: 'success', data: records.slice(start, end), page: pageNum, size: pageSize, total, pages: Math.ceil(total / pageSize) });
});

router.get('/stat', async (req, res) => {
  const { userId, date } = req.query;
  if (!userId) return sendError(res, 400, 'userId 为必传参数');
  const target = date || new Date().toISOString().split('T')[0];

  const data = await readData();
  let records = (data.sensors || []).filter(r => r.userId == userId && r.createTime.startsWith(target));
  if (records.length === 0) return sendSuccess(res, {
    count: 0, avgLux: 0, avgTemperature: 0, avgHumidity: 0, avgSoilMoisture: 0,
    maxLux: 0, minLux: 0, latest: null
  });

  const latest = records[records.length - 1];
  const luxVals = records.map(r => r.lux).filter(v => v !== null);
  const tempVals = records.map(r => r.temperature).filter(v => v !== null);
  const humVals = records.map(r => r.humidity).filter(v => v !== null);
  const soilVals = records.map(r => r.soilMoisture).filter(v => v !== null);
  const avg = arr => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

  sendSuccess(res, {
    count: records.length,
    avgLux: avg(luxVals), avgTemperature: avg(tempVals), avgHumidity: avg(humVals), avgSoilMoisture: avg(soilVals),
    maxLux: luxVals.length ? Math.max(...luxVals) : 0, minLux: luxVals.length ? Math.min(...luxVals) : 0,
    latest
  });
});

module.exports = router;
