import Assertion from '../../../../util/assertion/Assertion'

const Coordinate = class {
  #x
  #y
  
  static of (x, y) {
    Assertion.assertNumber(x)
    Assertion.assertNumber(y)
    return new Coordinate(x, y)
  }
  
  static x (x) {
    Assertion.assertNumber(x)
    return Coordinate.of(x, 0)
  }
  
  static y (y) {
    Assertion.assertNumber(y)
    return Coordinate.of(0, y)
  }
  
  constructor (x, y) {
    this.#x = x
    this.#y = y
  }
  
  plus (coordinate) {
    Assertion.assertInstanceOf(coordinate, Coordinate)
    return Coordinate.of(this.#round(this.#x + coordinate.x), this.#round(this.#y + coordinate.y))
  }
  
  minus (coordinate) {
    Assertion.assertInstanceOf(coordinate, Coordinate)
    return Coordinate.of(this.#round(this.#x - coordinate.x), this.#round(this.#y - coordinate.y))
  }
  
  #round (v) {
    return Math.round(v)
  }
  
  get x () {
    return this.#x
  }
  
  get y () {
    return this.#y
  }
}

Coordinate.DEFAULT = Coordinate.of(0, 0)

export default Coordinate
