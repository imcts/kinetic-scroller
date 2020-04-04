import ScrollRenderer from '../core/ScrollRenderer'
import Coordinate from '../vo/Coordinate'
import ScrollerElement from '../vo/ScrollerElement'
import Assertion from '../../../../util/assertion/Assertion'
import SelectedElement from '../vo/SelectedElement'

const SelectorRenderer = class extends ScrollRenderer {
  static #PRIVATE = Symbol()
  static #HIDE_ELEMENT_COUNT = 2
  static #DEGREE = 15
  static #DEFAULT_OPACITY = 1
  static #TRANSLATE_Z = 25
  
  #currentIndex
  #innerContainer
  #innerElements
  #outerContainer
  #outerElements
  
  static of (innerElement, outerElement) {
    Assertion.assertInstanceOf(innerElement, HTMLElement)
    Assertion.assertInstanceOf(outerElement, HTMLElement)
    return new SelectorRenderer(SelectorRenderer.#PRIVATE, innerElement, outerElement)
  }
  
  constructor (PRIVATE, inner, outer) {
    Assertion.assertPrivate(PRIVATE, SelectorRenderer.#PRIVATE)
    super()
    this.#currentIndex = 0
    this.#innerContainer = inner
    this.#innerElements = Array.from(this.#innerContainer.children)
    this.#outerContainer = outer
    this.#outerElements = Array.from(this.#outerContainer.children)
    Object.seal(this)
  }
  
  render (coordinate) {
    const {y} = coordinate
    const containerHeight = this.#getContainerHeight()
    const halfContainerHeight = containerHeight / 2
    const itemHeight = this.#getItemHeight(containerHeight)
    const halfItemHeight = itemHeight / 2
    const scrolledCount = this.#calculateScrollCount(y, halfItemHeight, itemHeight)
    const centerIndex = this.#calculateElementIndex(scrolledCount)
    const verticalAlignMiddle = this.#calculateVerticalAlignMiddle(halfContainerHeight, halfItemHeight)
    const draggedDistance = this.#calculateDraggedDistance(y, scrolledCount, itemHeight)
    const draggedPercent = this.#calculateDraggedPercent(draggedDistance, halfItemHeight)
    const draggedDegree = this.#calculateDraggedDegree(draggedPercent)
    const opacityStep = this.#calculateOpacityStep()
    const draggedOpacity = this.#calculateDraggedOpacity(draggedPercent, opacityStep)
  
    this.#changeCurrentIndex(centerIndex)
    
    // center
    this.#render(
      centerIndex,
      verticalAlignMiddle,
      draggedDistance,
      draggedDegree,
      SelectorRenderer.#TRANSLATE_Z,
      SelectorRenderer.#DEFAULT_OPACITY - draggedOpacity
    )
    for (let i = 1, length = this.#innerElements.length / 2; i < length; i++) {
      const opacity = SelectorRenderer.#DEFAULT_OPACITY - i * opacityStep
      const degree = SelectorRenderer.#DEGREE * i
      const translateZ = SelectorRenderer.#TRANSLATE_Z

      // above
      this.#render(
        this.#calculateElementIndex(centerIndex - i),
        verticalAlignMiddle,
        draggedDistance - i * itemHeight,
        degree + draggedDegree,
        translateZ,
        opacity + draggedOpacity
      )

      // below
      this.#render(
        this.#calculateElementIndex(centerIndex + i),
        verticalAlignMiddle,
        draggedDistance + i * itemHeight,
        -(degree - draggedDegree),
        translateZ,
        opacity - draggedOpacity
      )
    }
    return coordinate
  }
  
  decideDestination (destination) {
    const itemHeight = this.#getItemHeight(this.#getContainerHeight())
    return Coordinate.y(Math.round(destination.y / itemHeight) * itemHeight)
  }
  
  #getContainerHeight () {
    return this.#innerContainer.offsetHeight
  }
  
  #getContainerMarginTop () {
    return parseInt(window.getComputedStyle(this.#innerContainer).marginTop)
  }
  
  #getItemHeight (containerHeight) {
    return containerHeight / (this.#innerElements.length - SelectorRenderer.#HIDE_ELEMENT_COUNT)
  }
  
  #calculateScrollCount (y, halfItemHeight, itemHeight) {
    return Math.floor((y + halfItemHeight) / itemHeight)
  }
  
  #calculateElementIndex (scrolledCount) {
    const {length} = this.#innerElements
    if (scrolledCount >= length) {
      return scrolledCount % length
    }
    if (scrolledCount < 0) {
      return this.#calculateElementIndex(length + (scrolledCount % length))
    }
    return scrolledCount
  }
  
  #calculateDraggedDistance (y, scrolledCount, itemHeight) {
    return -(y - scrolledCount * itemHeight)
  }
  
  #calculateVerticalAlignMiddle (halfContainerHeight, halfItemHeight) {
    return halfContainerHeight - halfItemHeight
  }
  
  #calculateDraggedPercent (draggedDistance, halfItemHeight) {
    return draggedDistance / halfItemHeight
  }
  
  #calculateDraggedDegree (draggedPercent) {
    return -(draggedPercent * SelectorRenderer.#DEGREE) / 2
  }
  
  #calculateOpacityStep () {
    return SelectorRenderer.#DEFAULT_OPACITY / parseInt(this.#innerElements.length / 2)
  }
  
  #calculateDraggedOpacity (draggedPercent, opacityValue) {
    return draggedPercent * opacityValue / 2
  }
  
  #changeCurrentIndex (centerIndex) {
    if (this.#currentIndex === centerIndex) {
      return
    }
    this.#notify(this.#currentIndex = centerIndex)
  }
  
  #notify (index) {
    const inner = this.#innerElements[index]
    const outer = this.#outerElements[index]
    if (!(inner && outer)) {
      return
    }
    this.notify(ScrollerElement.of(inner, outer))
  }
  
  #render (centerIndex, verticalAlignMiddle, translateY, rotateX, translateZ, opacity) {
    const inner = this.#innerElements[centerIndex]
    if (inner) {
      Object.assign(inner.style, {
        transform: `
          translateY(${verticalAlignMiddle}px)
          translateY(${translateY}px)
          rotateX(${rotateX}deg)
          translateZ(${translateZ}px)
        `,
        opacity
      })
    }
    const outer = this.#outerElements[centerIndex]
    if (outer) {
      Object.assign(outer.style, {
        transform: `
          translateY(${translateY}px)
          rotateX(${rotateX}deg)
          translateZ(${translateZ}px)
        `,
        opacity
      })
    }
  }
  
  findSelectedElement (current, target, wrapperElement) {
    const {y} = target
    const offsetHeight = this.#getOffsetHeight()
    const wrapperHeight = wrapperElement.offsetHeight
    const containerHeight = this.#getContainerHeight()
    const marginTop = this.#getContainerMarginTop()
    const clickedY = wrapperHeight - (offsetHeight - y)
    // clicked padding top
    if (clickedY < marginTop) {
      return SelectedElement.NONE
    }
    // clicked padding bottom
    if (clickedY > marginTop + containerHeight) {
      return SelectedElement.NONE
    }
    const itemHeight = this.#getItemHeight(containerHeight)
    const clickedContainerY = clickedY - marginTop
    const clickedItemIndex = Math.floor(clickedContainerY / itemHeight)
    const centerIndexOfShownItemCount = this.#getCenterIndexOfShownItemCount()
    const count = clickedItemIndex - centerIndexOfShownItemCount
    // clicked current element
    if (!count) {
      return SelectedElement.NONE
    }
    return SelectedElement.element(this.#innerElements[this.#calculateElementIndex(this.#currentIndex + count)])
  }
  
  #getCenterIndexOfShownItemCount () {
    return Math.floor((this.#innerElements.length - SelectorRenderer.#HIDE_ELEMENT_COUNT) / 2)
  }

  getElementPosition (targetElement, current) {
    const innerElements = this.#innerElements
    const centerIndexOfShownItemCount = this.#getCenterIndexOfShownItemCount()
    for (let i = -centerIndexOfShownItemCount; i <= centerIndexOfShownItemCount; i++) {
      const found = innerElements[this.#calculateElementIndex(this.#currentIndex + i)]
      if (targetElement === found) {
        const containerHeight = this.#getContainerHeight()
        const itemHeight = this.#getItemHeight(containerHeight)
        return current.plus(Coordinate.y(itemHeight * i))
      }
    }
    return current
  }
  
  #getOffsetHeight () {
    return Math.max(document.documentElement.offsetHeight, window.innerHeight || 0)
  }
}

export default SelectorRenderer
