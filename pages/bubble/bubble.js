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
  bubblePositions: [],
  gridLeft: 0,
  gridTop: 0,
  bubbleW: 0,
  bubbleH: 0,
  cols: 6,
  vibrateTimer: null,

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
          particles: [],
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

    // 延迟缓存泡泡位置，等渲染完成
    setTimeout(() => this.cacheBubblePositions(), 300)
  },

  // 缓存所有泡泡的位置信息，用于滑动检测
  cacheBubblePositions() {
    const query = wx.createSelectorQuery()
    query.select('.bubble-grid').boundingClientRect()
    query.selectAll('.bubble').boundingClientRect()
    query.exec((res) => {
      if (!res || !res[0] || !res[1]) return
      const gridRect = res[0]
      const bubbleRects = res[1]
      this.gridLeft = gridRect.left
      this.gridTop = gridRect.top
      this.bubblePositions = bubbleRects

      // 计算单个泡泡尺寸（取第一个）
      if (bubbleRects.length > 0) {
        this.bubbleW = bubbleRects[0].width
        this.bubbleH = bubbleRects[0].height
      }
    })
  },

  onBubbleTap(e) {
    const id = e.currentTarget.dataset.id
    this.popBubble(id)
  },

  // 网格触摸移动：实现滑动连续戳泡泡
  onGridTouchMove(e) {
    if (!e.touches || !e.touches[0]) return
    const touch = e.touches[0]
    const tx = touch.clientX
    const ty = touch.clientY

    // 遍历缓存的位置，找到触摸点下的泡泡
    for (let i = 0; i < this.bubblePositions.length; i++) {
      const rect = this.bubblePositions[i]
      if (!rect) continue
      if (
        tx >= rect.left &&
        tx <= rect.right &&
        ty >= rect.top &&
        ty <= rect.bottom
      ) {
        // 找到对应的泡泡 id（通过位置推算）
        const col = Math.round((rect.left - this.gridLeft) / (this.bubbleW + 2))
        const row = Math.round((rect.top - this.gridTop) / (this.bubbleH + 2))
        const id = row * this.cols + col
        if (id >= 0 && id < this.data.bubbles.length) {
          this.popBubble(id)
        }
        break
      }
    }
  },

  popBubble(id) {
    const bubbles = this.data.bubbles.slice()
    if (id < 0 || id >= bubbles.length) return
    if (bubbles[id].popped) return

    // 生成粒子数据
    const particleCount = 8
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6
      const dist = 30 + Math.floor(Math.random() * 40)
      particles.push({
        id: i,
        tx: Math.round(Math.cos(angle) * dist),
        ty: Math.round(Math.sin(angle) * dist),
        size: 6 + Math.floor(Math.random() * 10),
        color: bubbles[id].color
      })
    }

    bubbles[id].popping = true
    bubbles[id].particles = particles
    this.setData({ bubbles })

    // 震动反馈：连续戳时增强震动
    if (this.vibrateTimer) {
      wx.vibrateShort({ type: 'medium' })
    } else {
      wx.vibrateShort({ type: 'light' })
    }
    clearTimeout(this.vibrateTimer)
    this.vibrateTimer = setTimeout(() => {
      this.vibrateTimer = null
    }, 60)

    // 150ms 后标记为已弹出，清除粒子
    setTimeout(() => {
      const b = this.data.bubbles.slice()
      if (b[id]) {
        b[id].popping = false
        b[id].popped = true
        b[id].particles = []
        const poppedCount = this.data.poppedCount + 1
        const remainingCount = this.data.remainingCount - 1

        this.setData({
          bubbles: b,
          poppedCount,
          remainingCount
        })

        if (remainingCount === 0) {
          this.onGameComplete(poppedCount)
        }
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

    // 庆祝震动
    wx.vibrateLong()
  },

  resetGame() {
    this.initGame()
  },

  goBack() {
    wx.navigateBack()
  }
})
