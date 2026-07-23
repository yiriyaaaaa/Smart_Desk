import request from '../../utils/request'
import { formatTime } from '../../utils/format'

Page({
  data: {
    tank: {},
    formattedTime: '',
    loading: false,
    online: false,
    deviceId: '--',
    temperature: '--', ph: '--', turbidity: '--',
    heaterOn: false, alertOn: false
  },

  onLoad() {
    this.loadTank()
  },

  async loadTank() {
    this.setData({ loading: true })
    try {
      const res = await request({
        url: '/fishtank/state?deviceId=smart-fishtank-01'
      })
      this.setData({
        tank: res,
        formattedTime: formatTime(res.lastUpdateTime),
        online: !!res.online,
        deviceId: res.deviceId || '--',
        temperature: res.temperature != null ? res.temperature + '°C' : '--',
        ph: res.ph != null ? res.ph : '--',
        turbidity: res.turbidityNtu != null ? res.turbidityNtu + ' NTU' : '--',
        heaterOn: !!res.heaterOn,
        alertOn: !!res.alertOn
      })
    } catch (e) {
      // ignore
    } finally {
      this.setData({ loading: false })
    }
  },

  feed() {
    wx.showLoading({ title: '喂食命令下发中...' })
    request({
      url: '/device/control', method: 'POST',
      data: { deviceId: 'smart-fishtank-01', command: 'feed', value: { amountG: 1 } }
    }).then(() => {
      wx.showToast({ title: '已下发喂食指令', icon: 'success' })
    }).catch(() => {
      wx.showToast({ title: '下发失败', icon: 'none' })
    }).finally(() => wx.hideLoading())
  },

  toggleAlert() {
    const enabled = !this.data.alertOn
    wx.showLoading({ title: '警报命令下发中...' })
    request({
      url: '/device/control', method: 'POST',
      data: { deviceId: 'smart-fishtank-01', command: 'set_alert', value: { enabled } }
    }).then(() => {
      wx.showToast({ title: enabled ? '已开启警报' : '已关闭警报', icon: 'success' })
      this.setData({ alertOn: enabled })
    }).catch(() => {
      wx.showToast({ title: '下发失败', icon: 'none' })
    }).finally(() => wx.hideLoading())
  }
})
