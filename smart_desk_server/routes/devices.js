const express = require('express');
const router = express.Router();
const { readData, writeData, sendSuccess, sendError, validatePageParams } = require('../utils/helpers');

// 获取设备列表
router.get('/', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);
  const data = await readData();
  const total = data.devices.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const paginatedDevices = data.devices.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({ code: 200, msg: 'success', data: { list: paginatedDevices, total }, page: pageNum, size: pageSize, pages });
});

// 获取单个设备详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, 400, '设备ID不能为空');
  const data = await readData();
  const device = data.devices.find(d => d.id == id);
  device ? sendSuccess(res, device) : sendError(res, 404, '设备未找到');
});

// 上传/更新设备状态
router.put('/:id', async (req, res) => {
  const { id: paramId } = req.params;
  const { id, status, height, light } = req.body;
  if (!paramId || !id || !status || height === undefined || light === undefined) {
    return sendError(res, 400, '设备ID、状态、高度、亮度为必传参数');
  }
  if (paramId !== id) return sendError(res, 400, '路径ID与请求体ID不一致');

  const data = await readData();
  const index = data.devices.findIndex(d => d.id == id);
  if (index >= 0) {
    data.devices[index].status = status;
    data.devices[index].height = height;
    data.devices[index].light = light;
  } else {
    data.devices.push({ id, status, height, light });
  }

  if (await writeData(data)) {
    sendSuccess(res, { id, status, height, light }, '设备状态更新成功');
  } else {
    sendError(res, 500, '更新设备状态失败');
  }
});

module.exports = router;
