// app.js
App({
  onLaunch() {
    // 初始化本地存储
    const highScore = wx.getStorageSync('bubbleHighScore') || 0
    this.globalData.highScore = highScore
  },
  globalData: {
    highScore: 0
  }
})
