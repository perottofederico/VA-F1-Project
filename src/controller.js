import { laps, drivers } from './models'
import { drivers_legend, linechart } from './views'

class Controller {
  constructor () {
    // Models
    this.laps = laps
    this.drivers = drivers

    // Views
    this.views = ['drivers_legend', 'linechart', 'parallel_coords', 'barchart', 'scatterplot']
    // lets start with just linechart
    // this.views.forEach(v => { console.log([v]) })
    this.linechart = linechart()
    this.drivers_legend = drivers_legend()

    // Models functions binding
    this.laps.bindLapsListChanged(this.onLapsListChanged.bind(this))
    this.drivers.bindDriversListChanged(this.onDriversListChanged.bind(this))
    // Views functions binding

    /*
    this.views.forEach(v => {
      this[v].bindBarEnter(c => this.handleBarEnter(c)).bind(this)
      this[v].bindBarLeave(c => this.handleBarLeave(c)).bind(this)
      this[v].bindTitleClick(e => this.handleTitleClick(e)).bind(this)
    })
    */
  }

  //
  // Laps
  handleAddLap (lap) {
    this.laps.addLap(lap)
  }

  onLapsListChanged () {
    this.linechart.data(this.laps)
  }

  //
  // Drivers
  handleAddDriver (driver) {
    this.drivers.addDriver(driver)
  }

  onDriversListChanged () {
    this.drivers_legend.data(this.drivers)
  }
}

export default new Controller()
