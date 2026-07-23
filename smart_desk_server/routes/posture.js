const express = require('express');
const router = express.Router();
const { readData, writeData, sendSuccess, sendError } = require('../utils/helpers');

// 获取当前坐姿状态（返回最近一条记录）
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return sendError(res, 400, 'userId不能为空');
  const data = await readData();
  const records = data.posture.filter(p => p.userId == userId);
  if (records.length) {
    records.sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
    sendSuccess(res, records[records.length - 1]);
  } else {
    sendError(res, 404, '用户坐姿状态未找到');
  }
});

// 上传/更新坐姿状态
router.post('/', async (req, res) => {
  const { userId, postureStatus, createTime } = req.body;
  if (!userId || !postureStatus || !createTime) {
    return sendError(res, 400, 'userId、postureStatus、createTime为必传参数');
  }
  const data = await readData();
  const index = data.posture.findIndex(p => p.userId == userId);
  if (index >= 0) {
    data.posture[index].postureStatus = postureStatus;
    data.posture[index].createTime = createTime;
  } else {
    data.posture.push({ userId, postureStatus, createTime });
  }
  if (await writeData(data)) {
    sendSuccess(res, { userId, postureStatus, createTime }, '坐姿状态更新成功');
  } else {
    sendError(res, 500, '更新坐姿状态失败');
  }
});

module.exports = router;
