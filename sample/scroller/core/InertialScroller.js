import Observer from '../../../../base/observer/Observer'
import ScrollRenderer from './ScrollRenderer'
import Pressure from '../vo/Pressure'
import Coordinate from '../vo/Coordinate'
import Velocity from '../vo/Velocity'
import Distance from '../vo/Distance'
import Time from '../vo/Time'
import Assertion from '../../../../util/assertion/Assertion'

const InertialScroller = class extends Observer {
  static #INERTIAL_SCROLL_TIME = 325
  static #MIN_INERTIAL_DISTANCE = 1
  static #TRACKING_TIME = 50

  #wrapper
  #renderer
  #pressed
  #began
  #current
  #last
  #velocity
  #scrollTime
  #lastInteractionTime
  #velocityTracker
  #animator
  #handler
  #listener
  
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
  
  constructor (wrapper, renderer) {
    Assertion.assertInstanceOf(wrapper, HTMLElement)
    Assertion.assertInstanceOf(renderer, ScrollRenderer)
    super()
    this.#wrapper = wrapper
    this.#renderer = renderer
    this.#pressed = Pressure.new()
    this.#began = this.#current = this.#last = Coordinate.DEFAULT
    this.#lastInteractionTime = Time.now()
    this.#velocity = Velocity.DEFAULT
    this.#setScrollTime(InertialScroller.#INERTIAL_SCROLL_TIME)
    this.#setEventHandler()
    this.#setEventListener()
    this.#listenRenderer()
  }
  
  #setScrollTime (scrollTime) {
    this.#scrollTime = scrollTime
  }
  
  #setEventHandler () {
    this.#handler = new Map([
      ['down', this.#down.bind(this)],
      ['move', this.#move.bind(this)],
      ['up', this.#up.bind(this)],
      ['click', this.#click.bind(this)]
    ])
  }

  #setEventListener () {
    this.#listener = new Map([
      ['click', new Set()]
    ])
  }
  
  #listenRenderer () {
    this.#renderer.addListener(this)
  }
  
  #down (e) {
    const current = this.#current
    this.#pressed.press()
    this.#began = current.plus(InertialScroller.#getCoordinate(e))
    this.#velocity = Velocity.DEFAULT
    this.#last = current
    this.#lastInteractionTime = Time.now()
    this.#setScrollTime(InertialScroller.#INERTIAL_SCROLL_TIME)
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
    this.render(this.#began.minus(InertialScroller.#getCoordinate(e)))
  }
  
  render (coordinate) {
    Assertion.assertInstanceOf(coordinate, Coordinate)
    this.#current = this.#renderer.render(coordinate)
  }

  #up () {
    this.#stopVelocityTracking()
    if (!this.#pressed.isPressed()) {
      return this.#pressed.take()
    }
    this.#pressed.take()
    this.#inertialScroll()
  }
  
  #inertialScroll () {
    const velocity = this.#velocity
    if (this._isNotVelocityValid(velocity)) {
      return
    }
    const {x, y} = this.#current
    const distance = this._calculateInertialDistance(velocity)
    const destination = Coordinate.of(x + distance.x, y + distance.y)
    this.#animateInertialScroll(distance, destination)
  }
  
  _isNotVelocityValid (velocity) {
    Assertion.assertOverride()
  }
  
  _calculateInertialDistance (velocity) {
    Assertion.assertOverride()
  }
  
  #animateInertialScroll (inertialDistance, destination) {
    const decided = this.#renderer.decideDestination(destination)
    const {x, y} = this._decideInertialDistance(inertialDistance, decided, destination)
    const f = () => {
      if (this.#pressed.isPressed()) {
        return
      }
      const elapsedTime = Time.now().minus(this.#lastInteractionTime).time
      const exponentialFactor = Math.exp(-elapsedTime / this.#scrollTime)
      const distance = Distance.of(x * exponentialFactor, y * exponentialFactor)
      if (this.#canNotScroll(distance.getMaxDistance())) {
        return this.render(decided)
      }
      this.render(decided.minus(Coordinate.of(distance.x, distance.y)))
      this.#animator = requestAnimationFrame(f)
    }
    this.#cancelAnimation()
    this.#animator = requestAnimationFrame(f)
  }
  
  _decideInertialDistance (inertialDistance, decidedDestination, destination) {
    Assertion.assertOverride()
  }
  
  #canNotScroll (distance) {
    return distance < InertialScroller.#MIN_INERTIAL_DISTANCE
  }
  
  #cancelAnimation () {
    cancelAnimationFrame(this.#animator)
  }
  
  #click (e) {
    e.preventDefault()
    const selectedElement = this.#renderer.findSelectedElement(this.#current, InertialScroller.#getCoordinate(e), this.#wrapper)
    if (selectedElement.isNone()) {
      return
    }
    this.#listener.get('click').forEach(callback => callback(e, selectedElement.element))
  }
  
  scrollTo (element) {
    this.#setScrollTime(this._getScrollToTime())
    this.#scrollTo(element)
  }
  
  _getScrollToTime () {
    Assertion.assertOverride()
  }

  #scrollTo (element) {
    const destination = this.#renderer.getElementPosition(element, this.#current)
    const {x: cx, y: cy} = this.#current
    const {x: dx, y: dy} = destination
    const distance = Distance.of(dx - cx, dy - cy)
    this.#animateInertialScroll(distance, Coordinate.of(dx, dy))
  }
  
  animateTo (element) {
    this.#setScrollTime(this._getAnimateToTime())
    this.#scrollTo(element)
  }
  
  _getAnimateToTime () {
    Assertion.assertOverride()
  }
  
  run () {
    this.#bindEvent()
  }
  
  #bindEvent () {
    const wrapper = this.#wrapper
    const down = this.#handler.get('down')
    const move = this.#handler.get('move')
    const up = this.#handler.get('up')
    const click = this.#handler.get('click')
    wrapper.addEventListener('touchstart', down, false)
    wrapper.addEventListener('touchmove', move, false)
    wrapper.addEventListener('touchend', up, false)
    wrapper.addEventListener('click', click, false)
  }

  destroy () {
    this.#unbindEvent()
  }
  
  #unbindEvent () {
    const wrapper = this.#wrapper
    const down = this.#handler.get('down')
    const move = this.#handler.get('move')
    const up = this.#handler.get('up')
    const click = this.#handler.get('click')
    wrapper.removeEventListener('touchstart', down, false)
    wrapper.removeEventListener('touchmove', move, false)
    wrapper.removeEventListener('touchend', up, false)
    wrapper.removeEventListener('touchcancel', up, false)
    wrapper.removeEventListener('click', click, false)
    this.#setEventListener()
  }
  
  addClickEventListener (callback) {
    Assertion.assertFunction(callback)
    const listener = this.#listener.get('click')
    if (listener.has(callback)) {
      return false
    }
    listener.add(callback)
    return true
  }
}

export default InertialScroller
