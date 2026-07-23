import request from '../../utils/request'
import { formatTime } from '../../utils/format'

Page({
  data: {
    sensor: {},
    formattedTime: '',
    loading: false,
    soilMoisture: '--', temperature: '--', humidity: '--', lux: '--',
    tankLow: false, pumpOn: false, growLightOn: false, climateValid: false,
    deviceId: '--'
  },

  onLoad() {
    this.loadSensor()
  },

  async loadSensor() {
    this.setData({ loading: true })
    try {
      const res = await request({
        url: '/sensors/latest?userId=4001&deviceId=smart-plant-esp32s3'
      })
      this.setData({
        sensor: res,
        formattedTime: formatTime(res.createTime),
        deviceId: res.deviceId || '--',
        soilMoisture: res.soilMoisture != null ? res.soilMoisture + '%' : '--',
        temperature: res.temperature != null ? res.temperature + '°C' : '--',
        humidity: res.humidity != null ? res.humidity + '%' : '--',
        lux: res.lux != null ? res.lux + ' lux' : '--',
        tankLow: !!res.tankLow, pumpOn: !!res.pumpOn,
        growLightOn: !!res.growLightOn, climateValid: !!res.climateValid
      })
    } catch (e) {
      // ignore
    } finally {
      this.setData({ loading: false })
    }
  },

  water() {
    if (this.data.tankLow) {
      wx.showToast({ title: '水箱缺水，无法浇水', icon: 'none' })
      return
    }
    wx.showLoading({ title: '浇水命令下发中...' })
    request({
      url: '/device/control', method: 'POST',
      data: { deviceId: 'smart-plant-esp32s3', command: 'water', value: { seconds: 5 } }
    }).then(() => {
      wx.showToast({ title: '已下发浇水指令', icon: 'success' })
    }).catch(() => {
      wx.showToast({ title: '下发失败', icon: 'none' })
    }).finally(() => wx.hideLoading())
  },

  toggleLight() {
    const enabled = !this.data.growLightOn
    wx.showLoading({ title: '补光灯命令下发中...' })
    request({
      url: '/device/control', method: 'POST',
      data: { deviceId: 'smart-plant-esp32s3', command: 'set_grow_light', value: { enabled } }
    }).then(() => {
      wx.showToast({ title: enabled ? '已开启补光灯' : '已关闭补光灯', icon: 'success' })
      this.setData({ growLightOn: enabled })
    }).catch(() => {
      wx.showToast({ title: '下发失败', icon: 'none' })
    }).finally(() => wx.hideLoading())
  }
})
