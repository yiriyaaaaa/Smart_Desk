import request from '../../utils/request'

Page({

  data:{
    totalDuration:0,
    postureStatus:'',
    device:null
  },

  onLoad(){
    this.loadData()
  },

  async loadData(){

    const study = await request({
      url:'/study-time',
      data:{
        userId:1001
      }
    })

    const posture = await request({
      url:'/posture',
      data:{
        userId:1001
      }
    })

    const devices = await request({
      url:'/devices'
    })

    this.setData({

      totalDuration:study.totalDuration,

      postureStatus:posture.postureStatus,

      device:devices.list[0]

    })

  },

  goToCamera(){
    wx.navigateTo({
      url:'/pages/camera/camera'
    })
  }

})