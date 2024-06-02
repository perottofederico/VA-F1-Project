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

  computeMetrics (lastName, driverLaps) {
    let totalTime = 0

    const lapList = driverLaps.map(d => d.lapNumber)
    const pitStops = this.data.filter(d =>
      d.lastName.toLowerCase() === lastName.toLowerCase() &&
      lapList.includes(parseInt(d.lapNumber))
    )

    pitStops.forEach(d => {
      totalTime += d.time
    })
    return totalTime
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
