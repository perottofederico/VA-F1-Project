import * as d3 from 'd3'
import { drivers } from '../models'
class Laps {
  constructor () {
    this.data = []
    // this.onLapsListChanged = () => {}
  }

  addLap (lap) {
    if (isNaN(lap.lapStartDate)) {
      this.data.push(lap)
    }
    // this.onLapsListChanged()
  }

  computeDeltas (groupedLaps) {
    // Find the winner
    // Drivers from results.csv are sorted by finishing order
    const winner = drivers.data[0].Abbreviation
    groupedLaps.forEach(driver => {
      driver.forEach(lap => {
        // get same lap number and its laptime from the winner
        const winnerLap = groupedLaps.get(winner).find(winnerLap => winnerLap.lapNumber === lap.lapNumber)
        const delta = Date.parse(lap.lapStartDate) - Date.parse(winnerLap.lapStartDate)
        lap.delta = delta
      })
    })
  }

  // Different approach to computing deltas
  // In this function, the delta is computed with respect to the driver currently in the lead
  computeDeltas_2 (laps) {
    // group the laps by lap number
    const groupedLaps = d3.group(laps.data, d => d.lapNumber)
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
  // this function receives as parameter the grouped laps of a single driver
  computeAvgLaptime (driverLaps) {
    let totalLapTime = 0
    let ignoredLaps = 0
    if (driverLaps.length > 1) {
      driverLaps.forEach(lap => {
        console.log(lap.driver)
        // only consider laps in which drivers are actually racing (i.e. track status is 1)
        if (lap.lapTime !== null && lap.trackStatus === 1) {
          // convert lap time to ms
          totalLapTime = totalLapTime + this.laptimeToMilliseconds(lap.lapTime)
        } else {
          ignoredLaps += 1
        }
      })

      return this.millisecondsToLaptime(totalLapTime / (driverLaps.length - ignoredLaps))
    } else return 0
  }

  computeMetrics (driverLaps) {
    //
    let avgLaptime = 0
    let laptimeConsistency = 0

    // Avg Laptime
    let totalLapTime = 0
    let ignoredLaps = 0
    if (driverLaps.length > 1) {
      driverLaps.forEach(lap => {
        // only consider laps in which drivers are actually racing (i.e. track status is 1)
        if (lap.lapTime !== null && lap.trackStatus === 1) {
          // convert lap time to ms
          totalLapTime += this.laptimeToMilliseconds(lap.lapTime)
        } else {
          ignoredLaps += 1
        }
      })
      // If the driver somehow dnfd after the first lap and when no racing laps where done (e.g. Norris in Las Vegas)
      // we would have driverLaps.length===ignoredLaps, so a division by 0
      if (driverLaps.length !== ignoredLaps) {
        avgLaptime = totalLapTime / (driverLaps.length - ignoredLaps)
      } else avgLaptime = 0

      // Laptime Consistency (aka standard deviation)
      let sumOfSquaredDiffs = 0
      driverLaps.forEach(lap => {
        if (lap.lapTime !== null && lap.trackStatus === 1) {
          sumOfSquaredDiffs += (this.laptimeToMilliseconds(lap.lapTime) - (avgLaptime)) ** 2
        }
      })
      // Again, avoid edge cases where we end up dividing by zero
      if (driverLaps.length !== ignoredLaps) {
        const variance = sumOfSquaredDiffs / (driverLaps.length - ignoredLaps)
        laptimeConsistency = (100 - (Math.sqrt(variance) * 100 / avgLaptime))
      }
    }
    //
    return {
      avgLaptime,
      laptimeConsistency
    }
  }

  //
  // Some laps are missing the lapTime. generally this is due to DNFs or red flags
  //
  // if lap.laptime is null, compute it using the lap.lapStartDate of the next lap
  // unless there is no next lap, in which case the lap is ignored because it means
  // that the driver either DNFed or the race ended
  fixMissingLapTimes (laps) {
    // if lap.laptime is null, compute it using the lap.lapStartDate of the next lap
    // if there is no next lap, the lap is ignored
    laps.forEach(lap => {
      if (!lap.lapTime) {
        const nextLap = laps.find(l => l.lapNumber === lap.lapNumber + 1 && l.driver === lap.driver)
        if (nextLap) {
          const lapTime = Date.parse(nextLap.lapStartDate) - Date.parse(lap.lapStartDate)
          lap.lapTime = this.millisecondsToLaptime(lapTime)
        }
      } else {
        // For some reason some laptimes don't include the milliseconds.
        // This if statement handles that case.
        if (lap.lapTime.includes('.')) lap.lapTime = lap.lapTime.slice(10, -3)
        else lap.lapTime = lap.lapTime.slice(10).concat('.000')
      }
    })
  }

  laptimeToMilliseconds (lapTime) {
    const minutes = parseInt(lapTime.split(':')[0])
    const seconds = parseInt(lapTime.split(':')[1].split('.')[0])
    let ms = 0
    // For some reason some laptimes don't include the milliseconds.
    // This if statement handles that case.
    if (lapTime.split(':')[1].includes('.')) {
      ms = parseInt(lapTime.split('.')[1])
    }
    return minutes * 60000 + seconds * 1000 + ms
  }

  millisecondsToLaptime (ms) {
    const format = d3.timeFormat('%M:%S.%L')
    return format(ms)
  }

  //
  computeTyreStrategies (groupedLaps) {
    const graphData = []
    groupedLaps.forEach(driverlaps => {
      const stints = d3.group(driverlaps, d => d.stint)
      let lapOfPitstop = 0
      stints.forEach(stint => {
        graphData.push({
          driver: stint[0].driver,
          team: stint[0].team,
          stint: stint[0].stint,
          compound: stint[0].compound,
          length: stint.length,
          lap: lapOfPitstop
        })
        lapOfPitstop += stint.length
      })
    })
    return graphData
  }

  //
  bindLapsListChanged (callback) {
    this.onLapsListChanged = callback
  }

  //
  deleteData () {
    this.data = []
  }
}

export default new Laps()
