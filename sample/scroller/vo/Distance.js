import Assertion from '../../../../util/assertion/Assertion'

const Distance = class {
  #x
  #y
  
  static x (x) {
    return Distance.of(x, 0)
  }
  
  static y (y) {
    return Distance.of(0, y)
  }
  
  static of (x, y) {
    Assertion.assertNumber(x)
    Assertion.assertNumber(y)
    return new Distance(x, y)
  }
  
  constructor (x, y) {
    this.#x = x
    this.#y = y
  }
  
  getMaxDistance () {
    return Math.max(Math.abs(this.#x), Math.abs(this.#y))
  }
  
  get x () {
    return this.#x
  }
  
  get y () {
    return this.#y
  }
}

export default Distance
