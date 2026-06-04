Page({
  playBubble() {
    wx.navigateTo({ url: '/pages/bubble/bubble' })
  },
  comingSoon() {
    wx.showToast({ title: '即将上线，敬请期待', icon: 'none' })
  }
})
