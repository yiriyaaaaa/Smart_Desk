import request from '../../utils/request'
import { formatTime, formatStatus } from '../../utils/format'

Page({
  data:{
    totalDuration:0,
    postureStatus:'',
    device:null,
    overview: {},
    carTime: '', plantTime: '', fishTime: '',
    carState: '--', carOnline: false,
    plantMoisture: '--', plantOnline: false,
    fishTemp: '--', fishOnline: false
  },

  onLoad(){
    this.loadData()
  },

  async loadData(){
    const study = await request({ url:'/study-time', data:{ userId:1001 } }).catch(() => ({}))
    const posture = await request({ url:'/posture', data:{ userId:1001 } }).catch(() => ({}))
    const devices = await request({ url:'/devices' }).catch(() => ({ list: [] }))
    const overview = await request({ url:'/device/overview' }).catch(() => null)

    const ov = overview || {}
    this.setData({
      totalDuration: study.totalDuration || 0,
      postureStatus: posture.postureStatus || '',
      device: (devices.list && devices.list[0]) || {},
      overview: ov,
      carTime: formatTime(ov.car && ov.car.lastSeen),
      plantTime: formatTime(ov.plant && ov.plant.lastSeen),
      fishTime: formatTime(ov.fishTank && ov.fishTank.lastSeen),
      carState: (ov.car && ov.car.state) || '--',
      carOnline: !!(ov.car && ov.car.online),
      plantMoisture: (ov.plant && ov.plant.soilMoisture != null ? ov.plant.soilMoisture + '%' : '--'),
      plantOnline: !!(ov.plant && ov.plant.online),
      fishTemp: (ov.fishTank && ov.fishTank.temperature != null ? ov.fishTank.temperature + '°C' : '--'),
      fishOnline: !!(ov.fishTank && ov.fishTank.online)
    })
  },

  goToCamera(){
    wx.navigateTo({ url:'/pages/camera/camera' })
  },

  goCar(){
    wx.navigateTo({ url:'/pages/car/car' })
  },

  goFlowerPot(){
    wx.navigateTo({ url:'/pages/flower-pot/flower-pot' })
  },

  goFishTank(){
    wx.navigateTo({ url:'/pages/fish-tank/fish-tank' })
  }
})