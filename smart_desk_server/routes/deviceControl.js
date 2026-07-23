const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, sendSuccess, sendError } = require('../utils/helpers');

router.post('/control', async (req, res) => {
  const { deviceId, command, value } = req.body;
  if (!deviceId || !command) return sendError(res, 400, 'deviceId 和 command 为必传参数');

  const data = await readData();
  if (!data.commands) data.commands = [];

  if (command === 'stop') {
    data.commands = data.commands.filter(c =>
      !(c.deviceId === deviceId && (c.command === 'goto' || c.command === 'resume') && c.status === 'pending')
    );
  }
  if (command === 'goto') {
    data.commands = data.commands.filter(c =>
      !(c.deviceId === deviceId && c.command === 'goto' && c.status === 'pending')
    );
  }
  if (command === 'water') {
    const existing = data.commands.find(c =>
      c.deviceId === deviceId && c.command === 'water' && c.status === 'pending'
    );
    if (existing) return sendError(res, 400, '已有浇水命令待执行');
  }

  const cmd = {
    id: uuidv4(), deviceId, command, value: value || {},
    status: 'pending', createTime: new Date().toISOString(),
    updateTime: null, message: null
  };
  data.commands.push(cmd);
  if (data.commands.length > 1000) data.commands = data.commands.slice(-1000);

  if (await writeData(data)) {
    sendSuccess(res, cmd, '命令已下发');
  } else {
    sendError(res, 500, '保存命令失败');
  }
});

router.get('/commands', async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return sendError(res, 400, 'deviceId 为必传参数');
  const data = await readData();
  const cmds = (data.commands || []).filter(c => c.deviceId === deviceId && c.status === 'pending');
  sendSuccess(res, cmds);
});

router.put('/commands/:id', async (req, res) => {
  const { id } = req.params;
  const { status, message } = req.body;
  if (!id) return sendError(res, 400, '命令ID不能为空');
  if (!['pending', 'executing', 'completed', 'failed'].includes(status)) {
    return sendError(res, 400, 'status 必须是 pending/executing/completed/failed');
  }

  const data = await readData();
  const cmd = (data.commands || []).find(c => c.id === id);
  if (!cmd) return sendError(res, 404, '命令未找到');

  cmd.status = status;
  cmd.updateTime = new Date().toISOString();
  if (message) cmd.message = message;

  if (await writeData(data)) {
    sendSuccess(res, cmd, '命令状态更新成功');
  } else {
    sendError(res, 500, '更新失败');
  }
});

router.get('/overview', async (req, res) => {
  const data = await readData();
  const now = Date.now();

  const carStates = data.car_states || [];
  const car = carStates.length ? carStates[carStates.length - 1] : null;
  const plantSensors = data.sensors || [];
  const plant = plantSensors.length ? plantSensors[plantSensors.length - 1] : null;
  const fishStates = data.fishtank_states || [];
  const fish = fishStates.length ? fishStates[fishStates.length - 1] : null;

  sendSuccess(res, {
    car: car ? {
      deviceId: car.carId, online: (now - new Date(car.lastUpdateTime).getTime()) < 10000,
      state: car.state, lastSeen: car.lastUpdateTime
    } : null,
    plant: plant ? {
      deviceId: plant.deviceId, online: plant.createTime ? (now - new Date(plant.createTime).getTime()) < 30000 : false,
      soilMoisture: plant.soilMoisture, tankLow: plant.tankLow, lastSeen: plant.createTime
    } : null,
    fishTank: fish ? {
      deviceId: fish.deviceId, online: (now - new Date(fish.lastUpdateTime).getTime()) < 30000,
      temperature: fish.temperature, ph: fish.ph, lastSeen: fish.lastUpdateTime
    } : null
  });
});

module.exports = router;
