const Pressure = class {
  static new () {
    return new Pressure()
  }
  
  #pressed = false
  
  press () {
    this.#pressed = true
  }
  
  take () {
    this.#pressed = false
  }
  
  isPressed () {
    return this.#pressed
  }
}

export default Pressure
