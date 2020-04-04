import Assertion from '../../../../util/assertion/Assertion'
import Distance from './Distance'
import Time from './Time'

const Velocity = class {
  #x
  #y
  
  static of (x, y) {
    Assertion.assertNumber(x)
    Assertion.assertNumber(y)
    return new Velocity(x, y)
  }
  
  constructor (x, y) {
    this.#x = x
    this.#y = y
  }
  
  calculateVelocity (distance, elapsed) {
    Assertion.assertInstanceOf(distance, Distance)
    Assertion.assertInstanceOf(elapsed, Time)
    const {time} = elapsed
    return Velocity.of(
      distance.x / time,
      distance.y / time
    )
  }
  
  getMaxVelocity () {
    return Math.max(Math.abs(this.#x), Math.abs(this.#y))
  }
  
  get x () {
    return this.#x
  }
  
  get y () {
    return this.#y
  }
}

Velocity.DEFAULT = Velocity.of(0, 0)

export default Velocity
