const Coordinate = class {
  #x
  #y
  
  static of (x, y) {
    return new Coordinate(x, y)
  }
  
  constructor (x, y) {
    this.#x = x
    this.#y = y
  }
  
  plus (coordinate) {
    return Coordinate.of(this.#round(this.#x + coordinate.x), this.#round(this.#y + coordinate.y))
  }
  
  minus (coordinate) {
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
