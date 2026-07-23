const express = require('express');
const router = express.Router();
const { readData, writeData, sendSuccess, sendError, validatePageParams } = require('../utils/helpers');

router.get('/', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);
  const data = await readData();
  const total = data.users.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = data.users.slice(start, end);
  const pages = Math.ceil(total / pageSize);
  res.json({ code: 200, msg: 'success', data: { list, total }, page: pageNum, size: pageSize, pages });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, 400, '用户ID不能为空');
  const data = await readData();
  const user = data.users.find(item => item.id == id);
  user ? sendSuccess(res, user) : sendError(res, 404, '用户未找到');
});

router.post('/', async (req, res) => {
  const { name, class: cls } = req.body;
  if (!name || !cls) return sendError(res, 400, 'name和class为必传字段');
  const data = await readData();
  const newId = data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 1001;
  const user = { id: newId, name, class: cls };
  data.users.push(user);
  if (await writeData(data)) {
    sendSuccess(res, user, '用户创建成功');
  } else {
    sendError(res, 500, '创建失败');
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, class: cls } = req.body;
  if (!id) return sendError(res, 400, '用户ID不能为空');
  const data = await readData();
  const idx = data.users.findIndex(u => u.id == id);
  if (idx < 0) return sendError(res, 404, '用户未找到');
  if (name) data.users[idx].name = name;
  if (cls) data.users[idx].class = cls;
  if (await writeData(data)) {
    sendSuccess(res, data.users[idx], '用户更新成功');
  } else {
    sendError(res, 500, '更新失败');
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, 400, '用户ID不能为空');
  const data = await readData();
  const idx = data.users.findIndex(u => u.id == id);
  if (idx < 0) return sendError(res, 404, '用户未找到');
  data.users.splice(idx, 1);
  if (await writeData(data)) {
    sendSuccess(res, null, '用户删除成功');
  } else {
    sendError(res, 500, '删除失败');
  }
});

module.exports = router;
