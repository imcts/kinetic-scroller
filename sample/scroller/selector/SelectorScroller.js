import InertialScroller from '../core/InertialScroller'
import SelectorRenderer from './SelectorRenderer'
import Coordinate from '../vo/Coordinate'
import Distance from '../vo/Distance'
import ScrollerElement from '../vo/ScrollerElement'
import Assertion from '../../../../util/assertion/Assertion'

const SelectorScroller = class extends InertialScroller {
  static #PRIVATE = Symbol()
  static #INERTIAL_DISTANCE = 1000
  static #INERTIAL_DISTANCE_FACTOR = 0.7
  static #INERTIAL_SLIPPERY_FACTOR = 0.75
  static #ANIMATE_TO_TIME = 50
  static #SCROLL_TO_TIME = 0
  
  #listener
  
  static of (container, renderer) {
    return new SelectorScroller(SelectorScroller.#PRIVATE, container, renderer)
  }
  
  constructor (PRIVATE, container, renderer) {
    Assertion.assertPrivate(SelectorScroller.#PRIVATE, PRIVATE)
    Assertion.assertInstanceOf(container, HTMLElement)
    Assertion.assertInstanceOf(renderer, SelectorRenderer)
    super(container, renderer)
    this.#listener = new Set()
    Object.seal(this)
    this.render(Coordinate.DEFAULT)
  }
  
  _isNotVelocityValid (velocity) {
    return false
  }
  
  _calculateInertialDistance (velocity) {
    const inertialDistance = SelectorScroller.#INERTIAL_DISTANCE * SelectorScroller.#INERTIAL_DISTANCE_FACTOR
    return Distance.y(SelectorScroller.#INERTIAL_SLIPPERY_FACTOR * velocity.y * inertialDistance)
  }
  
  _decideInertialDistance (inertialDistance, decidedDestination, destination) {
    const centerCoordinate = decidedDestination.minus(destination)
    return Coordinate.y(inertialDistance.y + centerCoordinate.y)
  }
  
  _getScrollToTime () {
    return SelectorScroller.#SCROLL_TO_TIME
  }
  
  _getAnimateToTime () {
    return SelectorScroller.#ANIMATE_TO_TIME
  }
  
  addScrollItemChangeListener (f) {
    Assertion.assertFunction(f)
    this.#listener.add(f)
  }
  
  update (scroller) {
    Assertion.assertInstanceOf(scroller, ScrollerElement)
    const {innerElement, outerElement} = scroller
    this.#listener.forEach(f => f(innerElement, outerElement))
  }
}

export default SelectorScroller
