import { laps, drivers, pitStops, telemetry, pca } from './models'
import { drivers_legend, linechart, parallel_coordinates, stackedBarchart, scatterPlot } from './views'

class Controller {
  constructor () {
    // Models
    this.laps = laps
    this.drivers = drivers
    this.pitStops = pitStops
    this.telemetry = telemetry
    this.pca = pca

    // Views
    this.views = ['drivers_legend', 'linechart', 'parallel_coordinates', 'stackedBarchart', 'scatterplot']
    this.linechart = linechart()
    this.drivers_legend = drivers_legend()
    this.parallel_coordinates = parallel_coordinates()
    this.stackedBarchart = stackedBarchart()
    this.scatterPlot = scatterPlot()

    // Models functions binding
    this.laps.bindLapsListChanged(this.onLapsListChanged.bind(this))
    this.drivers.bindDriversListChanged(this.onDriversListChanged.bind(this))
    this.pitStops.bindPitStopsListChanged(this.onPitStopsListChanged.bind(this))
    this.telemetry.bindTelemetryListChanged(this.onTelemetryListChanged.bind(this))
    this.pca.bindPcaListChanged(this.onPcaListChanged.bind(this))
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

  // I don't think this is ever called
  onLapsListChanged () {
    this.linechart.data(this.laps)
    this.parallel_coordinates.laps(this.laps)
    this.stackedBarchart.laps(this.laps)
  }

  //
  // Drivers
  handleAddDriver (driver) {
    this.drivers.addDriver(driver)
  }

  onDriversListChanged () {
    this.drivers_legend.data(this.drivers)
    this.stackedBarchart.drivers(this.drivers)
    this.parallel_coordinates.drivers(this.drivers)
  }

  //
  // PitStops
  handleAddPitStop (pitStop) {
    this.pitStops.addPitStop(pitStop)
  }

  onPitStopsListChanged () {
    this.parallel_coordinates.pitStops(this.pitStops)
  }

  //
  // Telemtry
  handleAddTelemetryRow (row) {
    this.telemetry.addTelemetryRow(row)
  }

  onTelemetryListChanged () {
    this.parallel_coordinates.telemetry(this.telemetry)
  }

  //
  // PCA
  handleAddRow (row) {
    this.pca.addPcaRow(row)
  }

  onPcaListChanged () {
    this.scatterPlot.data(this.pca)
  }

  //
  deleteAllData () {
    this.laps.deleteData()
    this.drivers.deleteData()
    this.pitStops.deleteData()
    this.telemetry.deleteData()
    this.pca.deleteData()
  }

  fixMissingLapTimes () {
    this.laps.fixMissingLapTimes(this.laps.data)
  }

  handleRaceChanged () {
    this.fixMissingLapTimes()
    this.drivers_legend.data(this.drivers)
    this.linechart.data(this.laps)
    this.linechart.results(this.drivers)
    this.parallel_coordinates.laps(this.laps)
    this.parallel_coordinates.drivers(this.drivers)
    this.parallel_coordinates.pitStops(this.pitStops)
    this.parallel_coordinates.telemetry(this.telemetry)
    this.stackedBarchart.laps(this.laps)
    this.stackedBarchart.drivers(this.drivers)
    this.scatterPlot.data(this.pca)
  }
}

export default new Controller()
