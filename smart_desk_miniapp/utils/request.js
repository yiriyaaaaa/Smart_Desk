const BASE_URL = 'http://localhost:3000/api'

function request(options){

  return new Promise((resolve,reject)=>{

    wx.request({

      url: BASE_URL + options.url,

      method: options.method || 'GET',

      data: options.data || {},

      header:{
        'content-type':'application/json'
      },

      success(res){

        if(res.data.code !== 200){

          wx.showToast({
            title:res.data.msg,
            icon:'none'
          })

          reject(res)
          return
        }

        resolve(res.data.data)

      },

      fail(err){

        wx.showToast({
          title:'服务器连接失败',
          icon:'none'
        })

        reject(err)
      }

    })

  })

}

export default request