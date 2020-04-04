import Assertion from '../../../../util/assertion/Assertion'

const Time = class {
  #time
  
  static from (time) {
    Assertion.assertNumber(time)
    return new Time(time)
  }
  
  static now () {
    return new Time(Date.now())
  }
  
  constructor (time) {
    this.#time = time
  }
  
  minus (time) {
    Assertion.assertInstanceOf(time, Time)
    return Time.from(this.#time - time.time)
  }
  
  get time () {
    return this.#time
  }
}

export default Time
