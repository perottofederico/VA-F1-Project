import * as d3 from 'd3'

class Pca {
  constructor () {
    this.data = []
    // this.onPcaListChanged = () => {}
  }

  addPcaRow (row) {
    this.data.push(row)
    // this.onPcaListChanged()
  }

  //
  computeGraphData (laps) {
    const groupedLaps = d3.group(laps, d => d.Driver)
    const groupedData = []
    groupedLaps.forEach(driverLaps => {
      // compute the median of each lap dim1 and dim2
      const medianDim1 = d3.median(driverLaps, d => d.dim1)
      const medianDim2 = d3.median(driverLaps, d => d.dim2)
      groupedData.push({
        Driver: driverLaps[0].Driver,
        Team: driverLaps[0].Team,
        dim1: medianDim1,
        dim2: medianDim2
      })
    })
    return groupedData
  }

  //
  bindPcaListChanged (callback) {
    this.onPcaListChanged = callback
  }

  //
  deleteData () {
    this.data = []
  }
}

export default new Pca()
