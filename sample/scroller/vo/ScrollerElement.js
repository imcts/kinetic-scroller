import Assertion from '../../../../util/assertion/Assertion'

const ScrollerElement = class {
  #innerElement
  #outerElement
  
  static of (innerElement, outerElement) {
    Assertion.assertInstanceOf(innerElement, Element)
    Assertion.assertInstanceOf(outerElement, Element)
    return new ScrollerElement(innerElement, outerElement)
  }
  
  constructor (innerElement, outerElement) {
    this.#innerElement = innerElement
    this.#outerElement = outerElement
  }
  
  get innerElement () {
    return this.#innerElement
  }
  
  get outerElement () {
    return this.#outerElement
  }
}

export default ScrollerElement
