import request from '../../utils/request'
import { formatTime } from '../../utils/format'

Page({
  data: {
    car: {},
    online: false,
    formattedTime: '',
    loading: false,
    stateText: '--',
    poseX: '--', poseY: '--', poseYaw: '--',
    locQuality: '--',
    goalValid: false, goalX: '--', goalY: '--'
  },

  onLoad() {
    this.loadCar()
  },

  async loadCar() {
    this.setData({ loading: true })
    try {
      const res = await request({ url: '/car/state?carId=smart-car-01' })
      this.setData({
        car: res,
        online: res.online !== false,
        formattedTime: formatTime(res.lastUpdateTime),
        stateText: res.state || '--',
        poseX: res.pose?.x != null ? res.pose.x.toFixed(2) + ' m' : '--',
        poseY: res.pose?.y != null ? res.pose.y.toFixed(2) + ' m' : '--',
        poseYaw: res.pose?.yaw != null ? res.pose.yaw.toFixed(2) + ' rad' : '--',
        locQuality: res.localizationQuality != null ? (res.localizationQuality * 100).toFixed(0) + '%' : '--',
        goalValid: !!(res.goal && res.goal.valid),
        goalX: res.goal?.x?.toFixed(2) || '--',
        goalY: res.goal?.y?.toFixed(2) || '--'
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async sendCommand(command, value) {
    wx.showLoading({ title: '命令下发中...' })
    try {
      await request({
        url: '/device/control',
        method: 'POST',
        data: { deviceId: 'smart-car-01', command, value: value || {} }
      })
      wx.showToast({ title: '命令已下发', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '命令下发失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  goTo() { this.sendCommand('goto', { x: 4.0, y: 3.5, yaw: 0 }) },
  stop() { this.sendCommand('stop') },
  pause() { this.sendCommand('pause') },
  resume() { this.sendCommand('resume') }
})
