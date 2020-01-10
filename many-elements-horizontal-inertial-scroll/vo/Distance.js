const Distance = class {
  #x
  #y
  
  static x (x) {
    return Distance.of(x, 0)
  }
  
  static of (x, y) {
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

Distance.DEFAULT = Distance.of(0, 0)
