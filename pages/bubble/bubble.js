Page({
  data: {
    bubbles: [],
    poppedCount: 0,
    remainingCount: 0,
    highScore: 0,
    showComplete: false,
    isNewRecord: false,
    soundOn: true
  },

  colors: [],  // 不再需要颜色
  bubbleMap: {},
  gridLeft: 0,
  gridTop: 0,
  bubbleSize: 0,
  cols: 6,
  lastPopId: -1,
  vibrateTimer: null,
  popAudio: null,

  onLoad() {
    this.highScore = wx.getStorageSync('bubbleHighScore') || 0
    this.initAudio()
  },

  onReady() {
    this.initGame()
  },

  onUnload() {
    if (this.popAudio) {
      this.popAudio.destroy()
    }
  },

  // 初始化音效
  initAudio() {
    this.popAudio = wx.createInnerAudioContext()
    this.popAudio.src = '/pages/bubble/audio/pop.wav'
    this.popAudio.obeyMuteSwitch = false
  },

  // 播放戳破音效
  playPopSound() {
    if (!this.data.soundOn || !this.popAudio) return
    this.popAudio.stop()
    this.popAudio.seek(0)
    this.popAudio.play()
  },

  // 切换音效
  toggleSound() {
    const soundOn = !this.data.soundOn
    this.setData({ soundOn })
  },

  initGame() {
    const bubbles = []
    const rows = 12
    const cols = 6
    let id = 0
    this.bubbleMap = {}

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bubbles.push({
          id: id,
          popped: false
        })
        this.bubbleMap[id] = { row: r, col: c }
        id++
      }
    }

    this.lastPopId = -1

    this.setData({
      bubbles,
      poppedCount: 0,
      remainingCount: bubbles.length,
      highScore: this.highScore,
      showComplete: false,
      isNewRecord: false
    })

    setTimeout(() => this.cachePositions(), 200)
  },

  // 缓存位置
  cachePositions() {
    const query = wx.createSelectorQuery()
    query.select('.bubble-sheet').boundingClientRect()
    query.selectAll('.bubble-cell').boundingClientRect()
    query.exec((res) => {
      if (!res || !res[0]) return
      this.gridLeft = res[0].left || 0
      this.gridTop = res[0].top || 0

      if (res[1] && res[1].length > 0) {
        const r = res[1][0]
        this.bubbleSize = Math.round(r.width || 96)
      }
    })
  },

  onBubbleTap(e) {
    const id = e.currentTarget.dataset.id
    this.doPop(id)
  },

  // 滑动连续戳
  onGridTouchMove(e) {
    if (this.bubbleSize === 0) return
    if (!e.touches || !e.touches[0]) return

    const touch = e.touches[0]
    const col = Math.floor((touch.clientX - this.gridLeft) / this.bubbleSize)
    const row = Math.floor((touch.clientY - this.gridTop) / this.bubbleSize)
    if (col < 0 || col >= this.cols || row < 0 || row > 11) return

    const id = row * this.cols + col
    if (id === this.lastPopId) return
    this.lastPopId = id
    this.doPop(id)
  },

  onTouchEnd() {
    this.lastPopId = -1
  },

  doPop(id) {
    if (id < 0 || id >= this.data.bubbles.length) return
    const b = this.data.bubbles[id]
    if (!b || b.popped) return

    // 播放音效
    this.playPopSound()

    // 震动反馈
    if (this.vibrateTimer) {
      wx.vibrateShort({ type: 'medium' })
    } else {
      wx.vibrateShort({ type: 'light' })
    }
    clearTimeout(this.vibrateTimer)
    this.vibrateTimer = setTimeout(() => { this.vibrateTimer = null }, 60)

    // 标记戳破
    const poppedCount = this.data.poppedCount + 1
    const remainingCount = this.data.remainingCount - 1

    this.setData({
      ['bubbles[' + id + '].popped']: true,
      poppedCount,
      remainingCount
    })

    // 检查是否完成
    if (remainingCount === 0) {
      setTimeout(() => {
        this.onGameComplete(poppedCount)
      }, 300)
    }
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
    wx.vibrateLong()
  },

  resetGame() {
    this.initGame()
  },

  goBack() {
    wx.navigateBack()
  }
})
