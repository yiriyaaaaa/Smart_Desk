import request from '../../utils/request'

const BASE_URL = 'http://localhost:3000'

Page({
  data: {
    imageUrl: '',
    currentTime: '',
    isLive: false,
    imageError: false,
    hasUploadedImage: false,
    uploading: false
  },

  timer: null,
  timeTimer: null,

  onLoad() {
    this.checkStatus()
    this.refreshImage()
    this.updateTime()
    this.timer = setInterval(() => {
      this.refreshImage()
    }, 3000)
    this.timeTimer = setInterval(() => {
      this.updateTime()
    }, 1000)
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
    if (this.timeTimer) clearInterval(this.timeTimer)
  },

  async checkStatus() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${BASE_URL}/api/camera/info`,
          success: resolve,
          fail: reject
        })
      })
      if (res.data && res.data.code === 200) {
        this.setData({ hasUploadedImage: res.data.data.hasImage })
      }
    } catch {
      console.warn('获取摄像头状态失败')
    }
  },

  refreshImage() {
    const ts = Date.now()
    this.setData({
      imageUrl: `${BASE_URL}/api/camera?_t=${ts}`,
      isLive: true,
      imageError: false
    })
  },

  onImageError() {
    this.setData({ imageError: true, isLive: false })
  },

  onImageLoad() {
    this.setData({ imageError: false, isLive: true })
  },

  uploadFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        this.setData({ uploading: true })
        wx.uploadFile({
          url: `${BASE_URL}/api/camera`,
          filePath: tempPath,
          name: 'image',
          success: (uploadRes) => {
            const data = JSON.parse(uploadRes.data)
            if (data.code === 200) {
              wx.showToast({ title: '上传成功', icon: 'success' })
              this.setData({ hasUploadedImage: true, uploading: false })
              this.refreshImage()
            } else {
              wx.showToast({ title: data.msg || '上传失败', icon: 'none' })
              this.setData({ uploading: false })
            }
          },
          fail: () => {
            wx.showToast({ title: '上传失败，请检查服务器', icon: 'none' })
            this.setData({ uploading: false })
          }
        })
      }
    })
  },

  updateTime() {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const time = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    this.setData({ currentTime: time })
  }
})
