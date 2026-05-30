import request from '../../utils/request'

Page({

  data:{
    user:{}
  },

  onLoad(){
    this.loadUser()
  },

  async loadUser(){

    const res = await request({
      url:'/users/1002'
    })

    this.setData({
      user:res
    })

  }

})