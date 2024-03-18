import * as d3 from 'd3'

class Pca {
  constructor () {
    this.data = []
    this.onPcaListChanged = () => {}
  }

  addPcaRow (row) {
    this.data.push(row)
    this.onPcaListChanged()
  }

  //
  bindPcaListChanged (callback) {
    this.onPcaListChanged = callback
  }
}

export default new Pca()
