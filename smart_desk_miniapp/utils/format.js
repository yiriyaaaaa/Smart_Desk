function formatTime(timeStr) {
  if (!timeStr) return '--'
  let date = new Date(timeStr)
  if (isNaN(date.getTime())) {
    date = new Date(timeStr.replace(' ', 'T'))
  }
  if (isNaN(date.getTime())) return timeStr
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function formatStatus(status) {
  const map = { online: '在线', offline: '离线', error: '故障', normal: '良好', abnormal: '异常' }
  return map[status] || status || '--'
}

module.exports = { formatTime, formatStatus }
