import Assertion from '../../../../util/assertion/Assertion'

const Element = class {
  static #PRIVATE = Symbol()

  #element
  #previous
  #next
  
  static from (element) {
    Assertion.assertInstanceOf(element, HTMLElement)
    return new Element(Element.#PRIVATE, element)
  }
  
  constructor (PRIVATE, element) {
    Assertion.assertPrivate(PRIVATE, Element.#PRIVATE)
    this.#element = element
    Object.seal(this)
  }

  add (element) {
    Assertion.assertInstanceOf(element, Element)
    this.#previous = element
    if (this.#next) {
      this.#next.link(this, element)
    } else {
      this.setNext(element)
      element.setPrevious(this)
    }
    element.setNext(this)
  }
  
  link (current, element) {
    Assertion.assertInstanceOf(current, Element)
    Assertion.assertInstanceOf(element, Element)
    if (this.#next === current) {
      this.setNext(element)
      element.setPrevious(this)
      element.setNext(current)
    } else {
      this.#next.link(current, element)
    }
  }
  
  find (element) {
    Assertion.assertInstanceOf(element, HTMLElement)
    if (this.#element === element) {
      return this
    }
    return this.#next._find(this, element)
  }
  
  _find (current, element) {
    if (this.#element === element) {
      return this
    }
    if (this.#element === current) {
      return this
    }
    return this.#next._find(current, element)
  }
  
  innerText (text) {
    this.#element.innerText = text
  }
  
  getPrevious () {
    return this.#previous
  }
  
  setPrevious (element) {
    Assertion.assertInstanceOf(element, Element)
    this.#previous = element
  }
  
  getNext () {
    return this.#next
  }
  
  setNext (element) {
    Assertion.assertInstanceOf(element, Element)
    this.#next = element
  }
}

export default Element
