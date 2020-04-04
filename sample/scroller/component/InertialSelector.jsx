import React from 'react'
import PropTypes from 'prop-types'
import InertialScroller from '../core/InertialScroller'
import SelectorItem from '../model/SelectorItem'
import Element from '../model/Element'
import Assertion from '../../../../util/assertion/Assertion'

const InertialSelector = class extends React.Component {
  static #ITEM_COUNT = 7
  
  static propTypes = {
    item: PropTypes.instanceOf(SelectorItem).isRequired,
    createScroller: PropTypes.func.isRequired,
    createItemContent: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
  }
  
  #wrapper
  #innerContainer
  #outerContainer
  #inner
  #outer
  #elementToModel
  #scroller
  
  componentDidMount () {
    const {createScroller} = this.props
    const scroller = this.#scroller = createScroller(
      this.#wrapper.current,
      this.#innerContainer.current,
      this.#outerContainer.current
    )
    Assertion.assertInstanceOf(scroller, InertialScroller)
    scroller.addClickEventListener(this.#onClickScrollItem)
    scroller.addScrollItemChangeListener(this.#onChangeScrollItem)
    scroller.run()
  }
  
  componentWillUnmount () {
    const scroller = this.#scroller
    if (!scroller) {
      return
    }
    scroller.destroy()
  }
  
  constructor (props) {
    super(props)
    this.#wrapper = React.createRef()
    this.#innerContainer = React.createRef()
    this.#outerContainer = React.createRef()
    this.#elementToModel = new Map()
  }
  
  render () {
    const {item, createItemContent} = this.props
    const innerComponent = this.#getScrollItemComponent(item, createItemContent, 'selector-container-back-item', true)
    const outerComponent = this.#getScrollItemComponent(item, createItemContent, 'selector-container-front-item', false)
    return (
      <div ref={this.#wrapper} className="popup-selector-container-wrap">
        <div className="selector-container">
          <div ref={this.#innerContainer} className="selector-container-back">{innerComponent}</div>
          <div ref={this.#outerContainer} className="selector-container-front">{outerComponent}</div>
          <div className="selector-container-wrap-decoration"/>
        </div>
      </div>
    )
  }
  
  #getScrollItemComponent (item, createItemContent, className, isInner) {
    return this.#getLinedItems(item).map((item, i) => {
      const content = createItemContent(item)
      return <div ref={element => this.#bindElement(element, item, isInner)}
                  key={i}
                  className={className}>{content}</div>
    })
  }
  
  #getLinedItems (targetItem) {
    let item = this.#getStartItemFrom(targetItem)
    const items = [item]
    for (let i = 1; i < InertialSelector.#ITEM_COUNT; i++) {
      items.push(item = item.getNext())
    }
    return items.concat(items.splice(0, Math.floor(InertialSelector.#ITEM_COUNT / 2)))
  }
  
  #getStartItemFrom (item) {
    for (let i = Math.floor(InertialSelector.#ITEM_COUNT / 2); i--;) {
      item = item.getPrevious()
    }
    return item
  }
  
  #bindElement (el, item, isInner) {
    if (!el) {
      return
    }
    const element = Element.from(el)
    if (isInner) {
      this.#addInnerElement(element)
    } else {
      this.#addOuterElement(element)
    }
    this.#elementToModel.set(element, item)
  }
  
  #addInnerElement (element) {
    if (this.#inner) {
      this.#inner.add(element)
    } else {
      this.#inner = element
    }
  }
  
  #addOuterElement (element) {
    if (this.#outer) {
      this.#outer.add(element)
    } else {
      this.#outer = element
    }
  }
  
  #onChangeScrollItem = (innerElement, outerElement) => {
    const {createItemContent, onChange} = this.props
    const inners = this.#getLinedElements(this.#inner = this.#inner.find(innerElement))
    const outers = this.#getLinedElements(this.#outer = this.#outer.find(outerElement))
    const item = this.#elementToModel.get(this.#inner)
    const items = this.#getLinedItems(item)
    for (let i = inners.length; i--;) {
      const item = items[i]
      const content = createItemContent(item)
      const inner = inners[i]
      inner.innerText(content)
      outers[i].innerText(content)
      this.#elementToModel.set(inner, item)
    }
    onChange(item)
  }
  
  #getLinedElements (item) {
    let element = this.#getStartElementFrom(item)
    const elements = [element]
    for (let i = 1; i < InertialSelector.#ITEM_COUNT; i++) {
      elements.push(element = element.getNext())
    }
    return elements.concat(elements.splice(0, Math.floor(InertialSelector.#ITEM_COUNT / 2)))
  }
  
  #getStartElementFrom (item) {
    for (let i = Math.floor(InertialSelector.#ITEM_COUNT / 2); i--;) {
      item = item.getPrevious()
    }
    return item
  }

  #onClickScrollItem = (e, element) => {
    e.preventDefault()
    this.#scroller.animateTo(element)
  }
}

export default InertialSelector
