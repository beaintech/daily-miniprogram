Page({
  data: {
    bubbles: [],
    poppedCount: 0,
    remainingCount: 0,
    highScore: 0,
    showComplete: false,
    isNewRecord: false
  },

  colors: ['red', 'pink', 'purple', 'blue', 'teal', 'green', 'amber'],
  bubbleMap: {},       // id -> {row, col, color}
  gridLeft: 0,
  gridTop: 0,
  bubbleSize: 0,       // 单个泡泡尺寸(px)，用于位置推算
  cols: 6,
  lastPopId: -1,       // 防止同一泡泡在滑动时被重复触发
  vibrateTimer: null,

  onLoad() {
    this.highScore = wx.getStorageSync('bubbleHighScore') || 0
  },

  onReady() {
    this.initGame()
  },

  initGame() {
    const bubbles = []
    const rows = 12
    const cols = 6
    let id = 0
    this.bubbleMap = {}

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)]
        bubbles.push({
          id: id,
          popped: false,
          popping: false,
          color: color
        })
        this.bubbleMap[id] = { row: r, col: c, color: color }
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

    // onReady 后延迟一帧再查询 DOM 位置
    setTimeout(() => this.cachePositions(), 200)
  },

  // 缓存泡泡网格位置，用于滑动连续戳
  cachePositions() {
    const query = wx.createSelectorQuery()
    query.select('.bubble-grid').boundingClientRect()
    query.selectAll('.bubble').boundingClientRect()
    query.exec((res) => {
      if (!res || !res[0]) return
      this.gridLeft = res[0].left || 0
      this.gridTop = res[0].top || 0

      if (res[1] && res[1].length > 0) {
        const r = res[1][0]
        this.bubbleSize = Math.round(r.width || 50)
      }
    })
  },

  onBubbleTap(e) {
    const id = e.currentTarget.dataset.id
    this.doPop(id)
  },

  // 滑动连续戳：通过触摸坐标直接推算泡泡 id
  onGridTouchMove(e) {
    if (this.bubbleSize === 0) return
    if (!e.touches || !e.touches[0]) return

    const touch = e.touches[0]
    const col = Math.floor((touch.clientX - this.gridLeft) / this.bubbleSize)
    const row = Math.floor((touch.clientY - this.gridTop) / this.bubbleSize)
    if (col < 0 || col >= this.cols || row < 0 || row > 11) return

    const id = row * this.cols + col
    if (id === this.lastPopId) return   // 同一泡泡不重复触发
    this.lastPopId = id
    this.doPop(id)
  },

  onTouchEnd() {
    this.lastPopId = -1
  },

  doPop(id) {
    if (id < 0 || id >= this.data.bubbles.length) return
    const key = 'bubbles[' + id + ']'
    const b = this.data.bubbles[id]
    if (!b || b.popped || b.popping) return

    // 先标记 popping（触发缩放+闪光动画）
    this.setData({
      [key + '.popping']: true
    })

    // 震动反馈
    if (this.vibrateTimer) {
      wx.vibrateShort({ type: 'medium' })
    } else {
      wx.vibrateShort({ type: 'light' })
    }
    clearTimeout(this.vibrateTimer)
    this.vibrateTimer = setTimeout(() => { this.vibrateTimer = null }, 60)

    // 150ms 后标记为已戳破
    setTimeout(() => {
      const b2 = this.data.bubbles[id]
      if (!b2) return
      const poppedCount = this.data.poppedCount + 1
      const remainingCount = this.data.remainingCount - 1
      this.setData({
        ['bubbles[' + id + '].popping']: false,
        ['bubbles[' + id + '].popped']: true,
        poppedCount,
        remainingCount
      })
      if (remainingCount === 0) {
        this.onGameComplete(poppedCount)
      }
    }, 150)
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
