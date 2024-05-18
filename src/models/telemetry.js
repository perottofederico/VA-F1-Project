import * as d3 from 'd3'
import { laps } from '../models'

class Telemetry {
  constructor () {
    this.data = []
    // this.onTelemetryListChanged = () => {}
  }

  addTelemetryRow (row) {
    this.data.push(row.Speed)
    // this.onTelemetryListChanged()
  }

  computeMetrics (csv, startDate, endDate) {
    let total = 0
    let divisor = 0
    // Ideally i would map the row to a lap, and then filter out the laps
    // in which the drivers are not racing (e.g. yellow flags or safety cars)
    csv.forEach(row => {
      if (Date.parse(row.Date) >= startDate && Date.parse(row.Date) <= endDate) {
        // find the lap in laps that corresponds to this row
        const lap = laps.data.find(lap => lap.lapStartDate > row.Date)
        if (lap.trackStatus === 1) {
          total += parseInt(row.Speed)
          divisor += 1
        }
      }
    })
    if (divisor > 0) { return parseFloat((total / divisor).toFixed(2)) } else return 0
  }

  //
  bindTelemetryListChanged (callback) {
    this.onTelemetryListChanged = callback
  }

  //
  deleteData () {
    this.data = []
  }
}

export default new Telemetry()
