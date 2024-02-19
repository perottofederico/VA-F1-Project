import * as d3 from 'd3'

class Laps {
  constructor () {
    this.data = []
    this.onLapsListChanged = () => {}
  }

  addLap (lap) {
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
    // console.log(groupedLaps)
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
