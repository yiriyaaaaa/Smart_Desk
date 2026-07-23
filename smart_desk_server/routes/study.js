const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, sendSuccess, sendError, validatePageParams } = require('../utils/helpers');

// 获取学习时长统计（支持日/周/月维度）
router.get('/study-time', async (req, res) => {
  const { userId, from, to, granularity = 'day' } = req.query;
  if (!userId) return sendError(res, 400, '用户ID不能为空');

  const data = await readData();
  let sessions = data.study_sessions.filter(s => s.userId == userId);
  if (from) sessions = sessions.filter(s => new Date(s.startTime) >= new Date(from));
  if (to) sessions = sessions.filter(s => new Date(s.endTime) <= new Date(to));

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

  const groupByTime = (sessions, granularity) => {
    const groups = {};
    sessions.forEach(s => {
      let key;
      const start = new Date(s.startTime);
      if (granularity === 'day') {
        key = start.toISOString().split('T')[0];
      } else if (granularity === 'week') {
        const year = start.getFullYear();
        const week = Math.ceil((start.getDate() - start.getDay() + 7) / 7);
        key = `${year}-W${String(week).padStart(2, '0')}`;
      } else if (granularity === 'month') {
        key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      }
      groups[key] = (groups[key] || 0) + s.duration;
    });
    return groups;
  };

  const result = groupByTime(sessions, granularity);
  const responseData = {
    totalDuration,
    [granularity === 'day' ? 'daily' : granularity === 'week' ? 'weekly' : 'monthly']: result
  };
  sendSuccess(res, responseData);
});

// 添加学习记录
router.post('/study-sessions', async (req, res) => {
  const { userId, startTime, endTime } = req.body;
  if (!userId || !startTime || !endTime) {
    return sendError(res, 400, 'userId、startTime、endTime为必传参数');
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return sendError(res, 400, '时间格式不合法，请传入有效时间');
  }
  if (start >= end) return sendError(res, 400, '开始时间不能晚于结束时间');

  const duration = Math.round((end - start) / 60000);
  const newSession = { recordId: uuidv4(), userId, startTime, endTime, duration };

  const data = await readData();
  data.study_sessions.push(newSession);
  if (await writeData(data)) {
    sendSuccess(res, newSession, '学习记录添加成功');
  } else {
    sendError(res, 500, '添加学习记录失败');
  }
});

// 获取学习记录列表
router.get('/study-sessions', async (req, res) => {
  const { page = 1, size = 10, userId } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);
  const data = await readData();
  let sessions = userId
    ? data.study_sessions.filter(s => s.userId == userId)
    : data.study_sessions;
  const userMap = data.users.reduce((m, u) => { m[u.id] = u.name; return m; }, {});
  sessions = sessions.map(s => ({ ...s, userName: userMap[s.userId] || '' }));

  const total = sessions.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const paginatedSessions = sessions.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({ code: 200, msg: 'success', data: paginatedSessions, page: pageNum, size: pageSize, pages, total });
});

// 获取单个用户学习记录（按用户ID分页）
router.get('/study-sessions/user', async (req, res) => {
  const { userId, page = 1, size = 10 } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);
  if (!userId) return sendError(res, 400, 'userId不能为空');

  const data = await readData();
  const sessions = data.study_sessions.filter(s => s.userId == userId);
  const total = sessions.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const paginatedSessions = sessions.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({ code: 200, msg: 'success', data: paginatedSessions, page: pageNum, size: pageSize, pages, total });
});

module.exports = router;
