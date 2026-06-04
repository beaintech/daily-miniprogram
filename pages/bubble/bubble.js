Page({
  data: {
    bubbles: [],
    poppedCount: 0,
    remainingCount: 0,
    highScore: 0,
    showComplete: false,
    isNewRecord: false,
    touching: false
  },

  colors: ['red', 'pink', 'purple', 'blue', 'teal', 'green', 'amber'],

  onLoad() {
    this.highScore = wx.getStorageSync('bubbleHighScore') || 0
    this.initGame()
  },

  initGame() {
    const bubbles = []
    const rows = 12
    const cols = 6
    let id = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bubbles.push({
          id: id++,
          row: r,
          col: c,
          popped: false,
          popping: false,
          color: this.colors[Math.floor(Math.random() * this.colors.length)]
        })
      }
    }
    this.setData({
      bubbles,
      poppedCount: 0,
      remainingCount: bubbles.length,
      highScore: this.highScore,
      showComplete: false,
      isNewRecord: false
    })
  },

  onBubbleTap(e) {
    const id = e.currentTarget.dataset.id
    const bubbles = this.data.bubbles.slice()

    if (bubbles[id].popped) return

    // 标记当前泡泡为正在弹出
    bubbles[id].popping = true
    this.setData({ bubbles })

    // 震动反馈
    wx.vibrateShort({ type: 'light' })

    // 150ms 后标记为已弹出
    setTimeout(() => {
      bubbles[id].popping = false
      bubbles[id].popped = true
      const poppedCount = this.data.poppedCount + 1
      const remainingCount = this.data.remainingCount - 1

      this.setData({
        bubbles,
        poppedCount,
        remainingCount
      })

      // 检查是否全部完成
      if (remainingCount === 0) {
        this.onGameComplete(poppedCount)
      }
    }, 120)
  },

  // 触摸移动时连续戳泡泡
  onBubbleTouchMove(e) {
    // 使用 touchmove 实现滑动连续戳
  },

  onGameComplete(score) {
    let isNewRecord = false
    if (score > this.highScore) {
      this.highScore = score
      wx.setStorageSync('bubbleHighScore', score)
      isNewRecord = true
    }

    this.setData({
      showComplete: true,
      isNewRecord,
      highScore: this.highScore
    })

    // 震动庆祝
    wx.vibrateLong()
  },

  resetGame() {
    this.initGame()
  },

  goBack() {
    wx.navigateBack()
  }
})
