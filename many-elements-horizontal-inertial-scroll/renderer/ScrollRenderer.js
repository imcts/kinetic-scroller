const ScrollRenderer = class {
  render (coordinate) {
    const {x, y} = this._render(coordinate)
    return Coordinate.of(x, y)
  }
  
  _render (coordinate) {
    throw new TypeError(MESSAGE.ERROR.OVERRIDE)
  }
  
  getInertialDistance (velocity) {
    return this._getInertialDistance(velocity)
  }
  
  _getInertialDistance (velocity) {
    throw new TypeError(MESSAGE.ERROR.OVERRIDE)
  }
}
