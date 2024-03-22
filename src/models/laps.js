import * as d3 from 'd3'
import { drivers } from '../models'
class Laps {
  constructor () {
    this.data = []
    // this.onLapsListChanged = () => {}
  }

  addLap (lap) {
    //
    // Some laps are missing the lapTime
    // this can be due to multiple reasons(red flags, crashes, retirements, pit stops)
    // in the case of pitstops, it is useful to compute them separately
    // in the case of red flags and DNFs we can tell the application to ignore them
    /*
    if (lap.lapTime === null) {
      // Red flag
      if (lap.trackStatus % 5) {
        // handle red flag
      }
      // Entered the pit lane
      if (lap.pitInTime) {
        // handle pitstop lap
      }
    }
    */
    this.data.push(lap)
    // this.onLapsListChanged()
  }

  computeDeltas (groupedLaps) {
    // console.log([...data])
    // FIX this, need to know the real winner (even though its most likely VER lol)
    // For now assume winner is VER
    const winner = drivers.data[0].Abbreviation
    groupedLaps.forEach(driver => {
      // console.log(driver)
      driver.forEach(lap => {
        // console.log(lap)
        // get same lap number and its laptime from the winner
        const winnerLap = groupedLaps.get(winner).find(winnerLap => winnerLap.lapNumber === lap.lapNumber)
        const delta = Date.parse(lap.lapStartDate) - Date.parse(winnerLap.lapStartDate)
        // console.log(delta)
        lap.delta = delta
      })
    })
  }

  // Different approach to computing deltas
  computeDeltas_2 (laps) {
    //
    // Find the winner
    // Drivers from results.csv are sorted by finishing order
    const winner = drivers.data[0].Abbreviation
    console.log('need to use this winner stuff to make the other function usable' + winner)
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
  // this function receives as parameter the grouped laps of a single driver
  computeAvgLaptime (driverLaps) {
    let totalLapTime = 0
    let ignoredLaps = 0
    if (driverLaps.length > 1) {
      driverLaps.forEach(lap => {
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

      avgLaptime = totalLapTime / (driverLaps.length - ignoredLaps)

      //
      // Laptime Consistency
      let sumOfSquares = 0
      driverLaps.forEach(lap => {
        if (lap.lapTime !== null && lap.trackStatus === 1) {
          sumOfSquares += (this.laptimeToMilliseconds(lap.lapTime) - (avgLaptime)) ** 2
        }
      })
      const stdDev = Math.sqrt(sumOfSquares / ignoredLaps)
      laptimeConsistency = Math.round((stdDev / avgLaptime * 100) * 1000) / 1000 // toFixed(3) converts it to a string but maybe its fine?
    }

    //
    // avgLaptime = this.millisecondsToLaptime(avgLaptime)
    return {
      avgLaptime,
      laptimeConsistency
    }
  }

  laptimeToMilliseconds (lapTime) {
    const time = lapTime.replace('0 days 00:', '').slice(0, -3)
    const minutes = parseInt(time.split(':')[0])
    const seconds = parseInt(time.split(':')[1].split('.')[0])

    return minutes * 60000 + seconds * 1000 + parseInt(time.split('.')[1])
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
