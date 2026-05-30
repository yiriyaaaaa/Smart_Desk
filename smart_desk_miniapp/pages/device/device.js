import request from '../../utils/request'

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

  }

})