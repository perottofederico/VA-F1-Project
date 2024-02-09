import models from './models'
import views from './views'

class Controller {
  constructor () {
    // Models
    this.laps = models.laps
    // Views
    this.views = ['linechart', 'parallel_coords', 'barchart', 'scatterplot']
    // lets start with just linechart
    // this.views.forEach(v => { console.log([v]) })
    this.linechart = views.linechart()

    // Models functions binding
    this.laps.bindLapsListChanged(this.onLapsListChanged.bind(this))
    // Views functions binding

    /*
    this.views.forEach(v => {
      this[v].bindBarEnter(c => this.handleBarEnter(c)).bind(this)
      this[v].bindBarLeave(c => this.handleBarLeave(c)).bind(this)
      this[v].bindTitleClick(e => this.handleTitleClick(e)).bind(this)
    })
    */
  }

  handleAddLap (lap) {
    this.laps.addLap(lap)
  }

  onLapsListChanged () {
    // this.views.forEach(v => { this[v].data(this.laps.lapsCount) })
    this.linechart.data(this.laps)
    this.linechart.deltas(this.laps.deltas)
  }
}

export default new Controller()
