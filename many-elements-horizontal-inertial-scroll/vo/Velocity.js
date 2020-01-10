const Velocity = class {
  #x
  #y
  
  static of (x, y) {
    return new Velocity(x, y)
  }
  
  constructor (x, y) {
    this.#x = x
    this.#y = y
  }
  
  calculateVelocity (distance, elapsed) {
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
