import 'normalize.css'
import * as d3 from 'd3'

import './index.scss'

import controller from './controller'
import { formatLap, formatPitStop } from './utils'

async function init () {
  window.d3 = d3
  window.app = controller
  await loadData()
  const linechartViews = ['drivers_legend', 'linechart']
  const views = ['parallel_coordinates', 'stackedBarchart']

  // Header
  const menuContainer = d3.select('#root').append('div')
    .attr('class', 'header')
    .append('select')
    .attr('id', 'selectButton')

  // linechart
  const linechartContainer = d3.select('#root').append('div')
    .attr('class', 'linechart_container')
    .attr('id', 'linechart_container')
    .append('div')
    .attr('class', 'linechart')
    .attr('id', 'linechart')

  const { width, height } = linechartContainer.node().getBoundingClientRect()
  controller.linechart
    .xAttribute('lapNumber')
    .yAttribute('delta')
    .width(width)
    .height(height)
  linechartContainer.call(controller.linechart)

  // Legend
  const legendContainer = d3.select('#linechart_container').append('div')
    .attr('class', 'drivers_legend')
    .attr('id', 'drivers_legend')
  controller.drivers_legend
    .width(legendContainer.node().getBoundingClientRect().width)
    .height(legendContainer.node().getBoundingClientRect().height)
  legendContainer.call(controller.drivers_legend)

  // Parallel Coordinates
  const pcContainer = d3.select('#root').append('div')
    .attr('class', 'parallel_coordinates_container')
    .attr('id', 'parallel_coordinates_container')
  controller.parallel_coordinates
    .width(pcContainer.node().getBoundingClientRect().width)
    .height(pcContainer.node().getBoundingClientRect().height)
  pcContainer.call(controller.parallel_coordinates)

  // Stacked Barchart
  const stackedBarchartContainer = d3.select('#root').append('div')
    .attr('class', 'stacked_barchart_container')
    .attr('id', 'stacked_barchart_container')
  controller.stackedBarchart
    .width(stackedBarchartContainer.node().getBoundingClientRect().width)
    .height(stackedBarchartContainer.node().getBoundingClientRect().height)
  stackedBarchartContainer.call(controller.stackedBarchart)

  const scatterPlotContainer = d3.select('#root').append('div')
    .attr('class', 'scatterplot_container')
    .attr('id', 'scatterplot_container')
  controller.scatterPlot
    .width(scatterPlotContainer.node().getBoundingClientRect().width)
    .height(scatterPlotContainer.node().getBoundingClientRect().height)
  scatterPlotContainer.call(controller.scatterPlot)
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

  // Need to fix for divs not in linechart_container
  window.addEventListener('resize', _ => {
    linechartViews.forEach(a => {
      const container = d3.select('#root').select('#linechart_container').select(`.${(a)}`)
      const { width, height } = container.node().getBoundingClientRect()
      controller[`${(a)}`]
        .width(width)
        .height(height)
    })
    // How is this working lmao please fix this spoiler its not workingeiurngboqiuergboiquyerbgvf
    views.forEach(a => {
      const container = d3.select('#root').select('.stacked_barchart_container')
      const { width, height } = container.node().getBoundingClientRect()
      controller[`${(a)}`]
        .width(width)
        .height(height)
      console.log('views foreach: ' + width + ', ' + height)
    })
    const container = d3.select('#root').select('#scatterplot_container')
    const { width, height } = container.node().getBoundingClientRect()
    controller.scatterPlot
      .width(width)
      .height(height)
    console.log('scatterplot: ' + width + ', ' + height)
  })
}

async function loadData () {
  try {
    // Results.csv
    const results = await d3.csv('/results.csv')
    results.forEach(driver => {
      controller.handleAddDriver(driver)
    })

    // Laps.csv
    const lapsData = await d3.csv('/laps.csv', d3.autoType)
    // loop over the data and prepare it !CHECK use foreach?
    for (let i = 0; i < lapsData.length; i++) {
      const lap = formatLap(lapsData[i]) // Not sure i even need this but you know
      controller.handleAddLap(lap)
    }

    // Pitstops.csv
    const pitStops = await d3.csv('/pitstops.csv')
    pitStops.forEach(pitStop => {
      controller.handleAddPitStop(formatPitStop(pitStop))
    })

    // _telemetry.csv

    // PCA.csv
    const pca = await d3.csv('/PCA.csv')
    pca.forEach(row => {
      controller.handleAddRow(row)
    })
  } catch (e) {
    console.error('Error loadData\n', e)
  }
}

init()
