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

  computeDeltas (groupedLaps) {
    // console.log([...data])
    // Assume winner is VER
    groupedLaps.forEach(driver => {
      // console.log(driver)
      driver.forEach(lap => {
        // console.log(lap)
        // get same lap number and its laptime from the winner
        const winnerLap = groupedLaps.get('VER').find(winnerLap => winnerLap.lapNumber === lap.lapNumber)
        const delta = Date.parse(lap.lapStartDate) - Date.parse(winnerLap.lapStartDate)
        // console.log(delta)
        lap.delta = delta
      })
    })
  }

  // Different approach to computing deltas
  computeDeltas_2 (laps) {
    // group the laps by lap number
    const groupedLaps = d3.group(laps.data, d => d.lapNumber)
    console.log(groupedLaps)
    // For each lap find its leader in the race
    groupedLaps.forEach(laps => {
      const leader = laps.find(leader => leader.position === 1)
      // set his delta to 0
      leader.delta = 0
      // For
      laps.forEach(driver => {
        if (driver.driver !== leader.driver) {
          driver.delta = Date.parse(driver.lapStartDate) - Date.parse(leader.lapStartDate)
        }
      })
    })
  }

  //
  bindLapsListChanged (callback) {
    this.onLapsListChanged = callback
  }
}

export default new Laps()
