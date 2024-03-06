import * as d3 from 'd3'

class Drivers {
  constructor () {
    this.data = []
    this.onDriversListChanged = () => {}
  }

  addDriver (driver) {
    this.data.push(driver)
    this.onDriversListChanged()
  }

  //
  bindDriversListChanged (callback) {
    this.onDriversListChanged = callback
  }
}

export default new Drivers()
