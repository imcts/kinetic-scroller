const InertialScroller = class {
  static #TRACKING_TIME = 50
  static #MIN_INERTIAL_DISTANCE = 0.5
  static #SCROLL_TIME = 325
  static #MIN_VELOCITY = 0.2
  
  #container
  #renderer
  #pressed
  #began
  #current
  #last
  #velocity
  #lastInteractionTime
  #velocityTracker
  #handler
  
  static of (container, renderer) {
    return new InertialScroller(container, renderer)
  }
  
  static #getCoordinate (e) {
    let target = e
    const {changedTouches} = target
    if (changedTouches) {
      const [touch] = changedTouches
      if (!touch) {
        return Coordinate.DEFAULT
      }
      target = touch
    }
    return Coordinate.of(target.clientX, target.clientY)
  }
  
  constructor (container, renderer) {
    this.#container = container
    this.#renderer = renderer
    this.#pressed = Pressure.new()
    this.#began = this.#current = this.#last =Coordinate.DEFAULT
    this.#velocity = Velocity.DEFAULT
    this.#handler = new Map()
      .set('down', this.#down.bind(this))
      .set('move', this.#move.bind(this))
      .set('up', this.#up.bind(this))
  }
  
  #down (e) {
    const current = this.#current
    this.#pressed.press()
    this.#began = current.plus(InertialScroller.#getCoordinate(e))
    this.#velocity = Velocity.DEFAULT
    this.#last = current
    this.#lastInteractionTime = Time.now()
    this.#stopVelocityTracking()
    this.#startVelocityTracking()
  }
  
  #stopVelocityTracking () {
    this.#velocityTracker = clearInterval(this.#velocityTracker)
  }
  
  #startVelocityTracking () {
    this.#velocityTracker = setInterval(() => {
      const now = Time.now()
      const moved = this.#current.minus(this.#last)
      this.#velocity = this.#velocity.calculateVelocity(
        Distance.of(moved.x, moved.y),
        now.minus(this.#lastInteractionTime)
      )
      this.#last = this.#current
      this.#lastInteractionTime = now
    }, InertialScroller.#TRACKING_TIME)
  }
  
  #move (e) {
    e.preventDefault()
    e.stopPropagation()
    if (!this.#pressed) {
      return
    }
    this.#render(this.#began.minus(InertialScroller.#getCoordinate(e)))
  }
  
  #render (coordinate) {
    this.#current = this.#renderer.render(coordinate)
  }
  
  #up (e) {
    e.preventDefault()
    this.#stopVelocityTracking()
    if (!this.#pressed.isPressed()) {
      return this.#pressed.take()
    }
    this.#pressed.take()
    this.#animateInertialScroll()
  }

  #animateInertialScroll () {
    if (this.#isNotVelocityValid()) {
      return
    }
    const {x: coordinateX, y: coordinateY} = this.#current
    const {x: inertialDistanceX, y: inertialDistanceY} = this.#renderer.getInertialDistance(this.#velocity)
    const destination = Coordinate.of(coordinateX + inertialDistanceX, coordinateY + inertialDistanceY)
    const f = () => {
      if (this.#pressed.isPressed()) {
        return
      }
      const elapsedTime = Time.now().minus(this.#lastInteractionTime).time
      const exponentialFactor = Math.exp(-elapsedTime / InertialScroller.#SCROLL_TIME)
      const distance = Distance.of(
        inertialDistanceX * exponentialFactor,
        inertialDistanceY * exponentialFactor
      )
      if (this.#canNotScroll(distance.getMaxDistance())) {
        return this.#render(destination)
      }
      this.#render(destination.minus(Coordinate.of(distance.x, distance.y)))
      requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  }
  
  #canNotScroll (distance) {
    return distance < InertialScroller.#MIN_INERTIAL_DISTANCE
  }
  
  #isNotVelocityValid () {
    return this.#velocity.getMaxVelocity() < InertialScroller.#MIN_VELOCITY
  }

  run () {
    this.#bindEvent()
  }
  
  #bindEvent () {
    const container = this.#container
    const down = this.#handler.get('down')
    const move = this.#handler.get('move')
    const up = this.#handler.get('up')
    container.addEventListener('mousedown', down, false)
    container.addEventListener('touchstart', down, false)
    container.addEventListener('mousemove', move, false)
    container.addEventListener('touchmove', move, false)
    container.addEventListener('mouseup', up, false)
    container.addEventListener('touchend', up, false)
  }

  destroy () {
    this.#unbindEvent()
  }
  
  #unbindEvent () {
    const container = this.#container
    const down = this.#handler.get('down')
    const move = this.#handler.get('move')
    const up = this.#handler.get('up')
    container.removeEventListener('mousedown', down, false)
    container.removeEventListener('touchstart', down, false)
    container.removeEventListener('mousemove', move, false)
    container.removeEventListener('touchmove', move, false)
    container.removeEventListener('mouseup', up, false)
    container.removeEventListener('touchend', up, false)
    container.removeEventListener('mouseleave', up, false)
    container.removeEventListener('touchcancel', up, false)
  }
}
