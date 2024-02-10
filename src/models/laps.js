import * as d3 from 'd3'

class Laps {
  constructor () {
    this.drivers = [] // list of drivers that took part to the race
    this.deltas = []
    this.lapsCount = []
    this.data = []
    this.lapTimesMs = []
    this.onLapsListChanged = () => {}
  }

  addLap (lap) {
    // List of driver partecipating to the race
    if (!this.drivers.includes(lap.driver)) {
      this.drivers.push(lap.driver)
    }

    // List of total laps, probably superflous !CHECK
    if (!this.lapsCount.includes(lap.lapNumber)) {
      this.lapsCount.push(lap.lapNumber)
    }

    this.deltas.push(Date.parse(lap.lapStartDate))

    // Push the raw objects to an array, for debugging purposes !CHECK
    const timeParse = d3.timeParse('%M:%S.%L')
    if (lap.lapTime !== null) {
      lap.lapTime = lap.lapTime.substring(0, lap.lapTime.length - 3).replace('0 days 00:', '')
      const split1 = lap.lapTime.split(':')
      const split2 = lap.lapTime.split('.')
      // this.lapTimesMs.push(parseInt(split1[0]) * 60000 + parseInt(split2[0]) * 1000 + parseInt(split2[1]))

      //

      this.lapTimesMs.push(timeParse(lap.lapTime))
      lap.lapTime = timeParse(lap.lapTime)
    } else {
      lap.lapTime = timeParse('00:00.000')
    }
    this.data.push(lap)

    this.onLapsListChanged()
  }

  //
  bindLapsListChanged (callback) {
    this.onLapsListChanged = callback
  }
}

export default new Laps()
