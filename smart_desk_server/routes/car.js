const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, sendSuccess, sendError } = require('../utils/helpers');

router.post('/state', async (req, res) => {
  const { carId, state, poseValid, pose, goal, localizationQuality, mapVersion, scanSequence } = req.body;
  if (!carId) return sendError(res, 400, 'carId 为必传参数');

  const data = await readData();
  if (!data.car_states) data.car_states = [];
  const idx = data.car_states.findIndex(c => c.carId === carId);
  const entry = {
    carId, state: state || 'idle',
    poseValid: !!poseValid, pose: pose || { x: 0, y: 0, yaw: 0 },
    goal: goal || { valid: false, x: 0, y: 0, yaw: 0 },
    localizationQuality: localizationQuality || 0,
    mapVersion: mapVersion || 0,
    scanSequence: scanSequence || 0,
    lastUpdateTime: new Date().toISOString()
  };
  if (idx >= 0) { data.car_states[idx] = entry; }
  else { data.car_states.push(entry); }

  if (await writeData(data)) {
    sendSuccess(res, { receivedAt: new Date().toISOString() }, '车辆状态上传成功');
  } else {
    sendError(res, 500, '保存失败');
  }
});

router.post('/scan', async (req, res) => {
  const { carId, scanSequence, distances } = req.body;
  if (!carId || !distances) return sendError(res, 400, 'carId 和 distances 为必传参数');
  if (!Array.isArray(distances) || distances.length !== 360) {
    return sendError(res, 400, 'distances 必须是长度为 360 的数组');
  }

  const data = await readData();
  if (!data.car_scans) data.car_scans = [];
  data.car_scans.push({
    carId, scanSequence: scanSequence || 0, distances,
    createTime: new Date().toISOString()
  });
  if (data.car_scans.length > 100) data.car_scans = data.car_scans.slice(-100);

  if (await writeData(data)) {
    sendSuccess(res, null, '雷达数据上传成功');
  } else {
    sendError(res, 500, '保存失败');
  }
});

router.get('/commands/next', async (req, res) => {
  const { carId } = req.query;
  if (!carId) return sendError(res, 400, 'carId 为必传参数');

  const data = await readData();
  const cmds = (data.commands || []).filter(c => c.deviceId === carId && c.status === 'pending');
  if (cmds.length === 0) return sendSuccess(res, null);

  const cmd = cmds[0];
  cmd.status = 'executing';
  cmd.updateTime = new Date().toISOString();
  if (await writeData(data)) {
    sendSuccess(res, cmd);
  } else {
    sendError(res, 500, '读取命令失败');
  }
});

router.get('/state', async (req, res) => {
  const { carId } = req.query;
  if (!carId) return sendError(res, 400, 'carId 为必传参数');
  const data = await readData();
  const state = (data.car_states || []).find(c => c.carId === carId);
  state ? sendSuccess(res, state) : sendError(res, 404, '未找到车辆状态');
});

router.get('/scan/latest', async (req, res) => {
  const { carId } = req.query;
  if (!carId) return sendError(res, 400, 'carId 为必传参数');
  const data = await readData();
  const scans = (data.car_scans || []).filter(s => s.carId === carId);
  if (scans.length === 0) return sendError(res, 404, '未找到雷达数据');
  sendSuccess(res, scans[scans.length - 1]);
});

router.get('/', async (req, res) => {
  const data = await readData();
  const states = data.car_states || [];
  const now = Date.now();
  const list = states.map(c => ({
    carId: c.carId, state: c.state,
    online: (now - new Date(c.lastUpdateTime).getTime()) < 10000,
    lastSeen: c.lastUpdateTime
  }));
  sendSuccess(res, { list, total: list.length });
});

module.exports = router;
