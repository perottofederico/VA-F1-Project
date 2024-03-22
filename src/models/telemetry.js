import * as d3 from 'd3'

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
    csv.forEach(row => {
      if (Date.parse(row.Date) >= startDate || Date.parse(row.Date) <= endDate) {
        total += parseInt(row.Speed)
        divisor += 1
      }
    })
    return parseFloat((total / divisor).toFixed(2))
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
