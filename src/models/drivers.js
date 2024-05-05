import * as d3 from 'd3'

class Drivers {
  constructor () {
    this.data = []
    // this.onDriversListChanged = () => {}
  }

  addDriver (driver) {
    this.data.push(driver)
    // this.onDriversListChanged()
  }

  //
  computeMetrics (lastName) {
    let result = 0
    let startingPos = 0
    let finishingPos = 0
    this.data.forEach(d => {
      if (d.LastName === lastName) {
        startingPos = parseInt(d.GridPosition)
        finishingPos = parseInt(d.Position)
        result = d.GridPosition - d.Position
      }
    })
    return { startingPos, finishingPos, result }
  }

  getTeam (abbreviation) {
    let team = ''
    this.data.forEach(d => {
      if (d.Abbreviation === abbreviation) {
        team = d.TeamName
      }
    })
    return team
  }

  //
  bindDriversListChanged (callback) {
    this.onDriversListChanged = callback
  }

  //
  deleteData () {
    this.data = []
  }
}

export default new Drivers()
