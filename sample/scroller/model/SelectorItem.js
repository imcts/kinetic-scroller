import Assertion from '../../../../util/assertion/Assertion'

const SelectorItem = class {
  #previous
  #next
  
  add (item) {
    Assertion.assertInstanceOf(item, SelectorItem)
    this.#previous = item
    if (this.#next) {
      this.#next._add(this, item)
    } else {
      this.setNext(item)
      item.setPrevious(this)
    }
    item.setNext(this)
  }
  
  _add (current, item) {
    Assertion.assertInstanceOf(current, SelectorItem)
    Assertion.assertInstanceOf(item, SelectorItem)
    if (this.#next === current) {
      this.setNext(item)
      item.setPrevious(this)
      item.setNext(current)
    } else {
      this.#next._add(current, item)
    }
  }
  
  has (item) {
    Assertion.assertInstanceOf(item, SelectorItem)
    if (this === item) {
      return true
    }
    return this.#next._has(this, item)
  }
  
  _has (current, item) {
    if (this === item) {
      return true
    }
    if (this === current) {
      return false
    }
    return this.#next._has(current, item)
  }
  
  getNext () {
    return this.#next
  }
  
  setNext (item) {
    Assertion.assertInstanceOf(item, SelectorItem)
    this.#next = item
  }
  
  getPrevious () {
    return this.#previous
  }
  
  setPrevious (item) {
    Assertion.assertInstanceOf(item, SelectorItem)
    this.#previous = item
  }
}

export default SelectorItem
