import request from '../../utils/request'

Page({

  data:{
    sessions:[]
  },

  onLoad(){
    this.loadSessions()
  },

  async loadSessions(){

    const res = await request({
      url:'/study-sessions/user',
      data:{
        userId:1001
      }
    })

    this.setData({
      sessions:res
    })

  }

})