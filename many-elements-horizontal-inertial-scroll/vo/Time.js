const Time = class {
  #time
  
  static from (time) {
    return new Time(time)
  }
  
  static now () {
    return new Time(Date.now())
  }
  
  constructor (time) {
    this.#time = time
  }
  
  minus (time) {
    return Time.from(this.#time - time.time)
  }
  
  get time () {
    return this.#time
  }
}
