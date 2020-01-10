const HorizontalRenderer = class extends ScrollRenderer {
  static #DISTANCE_FACTOR = 0.9
  static #SLIPPERY_FACTOR = 0.75
  
  #content
  #elements
  
  static from (content) {
    return new HorizontalRenderer(content)
  }
  
  constructor (content) {
    super()
    this.#content = content
  }
  
  _render (coordinate) {
    const x = this.#getX(coordinate.x)
    this.#content.style.transform = `translateX(${-x}px)`
    return {x, y: coordinate.y}
  }

  #getX (x) {
    const maxX = this.#getContentsWidth() - this.#content.offsetWidth
    if (x > maxX) {
      x = maxX
    }
    if (x < 0) {
      x = 0
    }
    return x
  }

  #getContentsWidth () {
    return this.#getElements().reduce((accumulator, el) => {
      const {width, marginLeft, marginRight} = window.getComputedStyle(el)
      return accumulator += [width, marginLeft, marginRight].reduce((accumulator, v) => accumulator += parseFloat(v), 0)
    }, 0)
  }
  
  #getElements () {
    if (this.#elements) {
      return this.#elements
    }
    return this.#elements = Array.from(this.#content.children)
  }
  
  _getInertialDistance (velocity) {
    const totalDistance = this.#getContentsWidth() * HorizontalRenderer.#DISTANCE_FACTOR
    return Distance.x(HorizontalRenderer.#SLIPPERY_FACTOR * velocity.x * totalDistance)
  }
}
