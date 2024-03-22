import * as d3 from 'd3'

class PitStops {
  constructor () {
    this.data = []
    // this.onPitStopsListChanged = () => {}
  }

  addPitStop (pitStop) {
    this.data.push(pitStop)
    // this.onPitStopsListChanged()
  }

  computeMetrics (lastName) {
    let totalTime = 0
    this.data.forEach(d => {
      if (d.lastName === lastName) {
        totalTime += d.time
      }
    })
    return parseFloat(totalTime.toFixed(2))
  }

  //
  bindPitStopsListChanged (callback) {
    this.onPitStopsListChanged = callback
  }

  //
  deleteData () {
    this.data = []
  }
}

export default new PitStops()
