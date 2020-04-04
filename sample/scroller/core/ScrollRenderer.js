import Observer from '../../../../base/observer/Observer'
import Coordinate from '../vo/Coordinate'
import Assertion from '../../../../util/assertion/Assertion'

const ScrollRenderer = class extends Observer {
  render (coordinate) {
    Assertion.assertInstanceOf(coordinate, Coordinate)
    return Assertion.assertOverride()
  }

  findSelectedElement (current, target, wrapperElement) {
    Assertion.assertInstanceOf(current, Coordinate)
    Assertion.assertInstanceOf(target, Coordinate)
    Assertion.assertInstanceOf(wrapperElement, HTMLElement)
    return Assertion.assertOverride()
  }
  
  getElementPosition (element, current) {
    Assertion.assertInstanceOf(element, HTMLElement)
    Assertion.assertInstanceOf(current, Coordinate)
    return Assertion.assertOverride()
  }
  
  decideDestination (destination) {
    Assertion.assertInstanceOf(destination, Coordinate)
    return Assertion.assertOverride()
  }
}

export default ScrollRenderer
