import 'normalize.css'
import * as d3 from 'd3'

import './index.scss'

import controller from './controller'
import { sentenceString, formatLap } from './utils'

async function init () {
  window.d3 = d3
  window.app = controller
  await loadData()
  const views = ['drivers_legend', 'linechart'] //, 'parallel_coords', 'barchart', 'scatterplot']

  // linechart

  const linechart_container = d3.select('#root').append('div')
    .attr('class', 'linechart_container')
    .attr('id', 'linechart_container')
    .append('div')
    .attr('class', 'linechart')
    .attr('id', 'linechart')

  const { width, height } = linechart_container.node().getBoundingClientRect()
  controller.linechart
    .xAttribute('lapNumber')
    .yAttribute('delta')
    .width(width)
    .height(height)
  linechart_container.call(controller.linechart)

  const legendContainer = d3.select('#linechart_container').append('div')
    .attr('class', 'drivers_legend')
    .attr('id', 'drivers_legend')

  controller.drivers_legend
    .width(legendContainer.node().getBoundingClientRect().width)
    .height(legendContainer.node().getBoundingClientRect().height)
  legendContainer.call(controller.drivers_legend)

  /*
  views.forEach(a => {
    const container = d3.select('#root').append('div')
      .attr('class', a)
      .attr('id', `${sentenceString(a)}_container`)
    const { width, height } = container.node().getBoundingClientRect()
    const viewName = `${a}`
    controller[viewName]
      .xAccessor(d => console.log(d))
      .yAttribute(a)
      .width(width)
      .height(height)
    container.call(controller[viewName])
  */

  // Lets focus on just the linechart for now
  /*
  window.addEventListener('resize', _ => {
    let container = d3.select('#root').select('#linechart_container').select('.linechart_graph')
    const { width, height } = container.node().getBoundingClientRect()
    let viewName = 'linechart'
    controller[viewName]
      .width(width)
      .height(height)

    //
    container = d3.select('#root').select('#linechart_container').select('.legend')

    const width2 = container.node().getBoundingClientRect().width
    const height2 = container.node().getBoundingClientRect().height
    console.log(controller)
    viewName = 'drivers_legend'

    controller[viewName]
      .width(width2)
      .height(height2)
  })
  */
  window.addEventListener('resize', _ => {
    views.forEach(a => {
      const container = d3.select('#root').select('#linechart_container').select(`.${(a)}`)
      const { width, height } = container.node().getBoundingClientRect()
      controller[`${(a)}`]
        .width(width)
        .height(height)
    })
  })
}

async function loadData () {
  try {
    const lapsData = await d3.csv('/laps.csv', d3.autoType)

    // loop over the data and prepare it !CHECK use foreach?
    for (let i = 0; i < lapsData.length; i++) {
      const lap = formatLap(lapsData[i]) // Not sure i even need this but you know
      controller.handleAddLap(lap)
    }

    const results = await d3.csv('/results.csv')
    results.forEach(driver => {
      controller.handleAddDriver(driver)
    })
  } catch (e) {
    console.error('Error loadData\n', e)
  }
}

init()
