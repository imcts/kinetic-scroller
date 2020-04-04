import Assertion from '../../../../util/assertion/Assertion'

const SelectedElement = class {
  #element
  #x
  #y
  
  static of (element, x, y) {
    Assertion.assertInstanceOf(element, Element)
    Assertion.assertNumber(x)
    Assertion.assertNumber(y)
    return new SelectedElement(element, x, y)
  }
  
  static element (element) {
    return SelectedElement.of(element, 0, 0)
  }
  
  static x (element, x) {
    return SelectedElement.of(element, x, 0)
  }
  
  constructor (element, x, y) {
    this.#element = element
    this.#x = x
    this.#y = y
  }
  
  isNone () {
    return this === SelectedElement.NONE
  }
  
  get element () {
    return this.#element
  }
  
  get x () {
    return this.#x
  }
  
  get y () {
    return this.#y
  }
}

SelectedElement.NONE = new SelectedElement(null, 0, 0)

export default SelectedElement
