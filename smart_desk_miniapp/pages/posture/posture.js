import request from '../../utils/request'

Page({

  data:{
    posture:{}
  },

  onLoad(){
    this.loadPosture()
  },

  async loadPosture(){

    const res = await request({
      url:'/posture',
      data:{
        userId:1001
      }
    })

    this.setData({
      posture:res
    })

  }

})