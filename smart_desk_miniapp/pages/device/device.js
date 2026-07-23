import request from '../../utils/request'
import { formatTime } from '../../utils/format'

Page({

  data:{
    device:{}
  },

  onLoad(){
    this.loadDevices()
  },

  async loadDevices(){

    const res = await request({
      url:'/devices/3001'
    })

    this.setData({
      device:res
    })

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