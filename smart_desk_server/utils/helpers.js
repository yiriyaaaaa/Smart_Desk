const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

const readData = async () => {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('读取数据失败：', err.message);
    return { users: [], study_sessions: [], devices: [], posture: [], flower_pot: [], fish_tank: [], sensors: [], car_states: [], car_scans: [], fishtank_states: [], fishtank_history: [], commands: [] };
  }
};

const writeData = async (newData) => {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('写入数据失败：', err.message);
    return false;
  }
};

const sendSuccess = (res, data = null, msg = 'success') => {
  res.json({ code: 200, msg, data });
};

const sendError = (res, code, msg, data = null) => {
  res.json({ code, msg, data });
};

const validatePageParams = (page, size) => {
  const pageNum = isNaN(parseInt(page, 10)) ? 1 : parseInt(page, 10);
  const pageSize = isNaN(parseInt(size, 10)) ? 10 : parseInt(size, 10);
  return {
    pageNum: Math.max(pageNum, 1),
    pageSize: Math.max(Math.min(pageSize, 100), 1)
  };
};

module.exports = { readData, writeData, sendSuccess, sendError, validatePageParams };
