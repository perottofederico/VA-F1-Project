import 'normalize.css'
import * as d3 from 'd3'

import './index.scss'

import controller from './controller'
import { formatLap, formatPitStop, getRacesList } from './utils'

async function init () {
  window.d3 = d3
  window.app = controller
  await loadData()
  const linechartViews = ['drivers_legend', 'linechart']
  const views = ['parallel_coordinates', 'stackedBarchart', 'scatterPlot']

  // Header
  const list = getRacesList()
  const menuContainer = d3.select('#root').append('div')
    .attr('class', 'header')
    .append('select')
    .attr('id', 'selectButton')
    .attr('class', 'selection')
    .on('change', () => updateData())

  menuContainer.selectAll('option')
    .data(list).enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d)

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
    .attr('class', 'stackedBarchart_container')
    .attr('id', 'stackedBarchart_container')
  controller.stackedBarchart
    .width(stackedBarchartContainer.node().getBoundingClientRect().width)
    .height(stackedBarchartContainer.node().getBoundingClientRect().height)
  stackedBarchartContainer.call(controller.stackedBarchart)

  // Scatterplot
  const scatterPlotContainer = d3.select('#root').append('div')
    .attr('class', 'scatterPlot_container')
    .attr('id', 'scatterPlot_container')
  controller.scatterPlot
    .width(scatterPlotContainer.node().getBoundingClientRect().width)
    .height(scatterPlotContainer.node().getBoundingClientRect().height)
  scatterPlotContainer.call(controller.scatterPlot)

  // Window resize listener
  window.addEventListener('resize', _ => {
    linechartViews.forEach(a => {
      const container = d3.select('#root').select('#linechart_container').select(`.${(a)}`)
      const { width, height } = container.node().getBoundingClientRect()
      controller[`${(a)}`]
        .width(width)
        .height(height)
    })
    views.forEach(a => {
      const container = d3.select('#root').select(`.${(a)}_container`)
      const { width, height } = container.node().getBoundingClientRect()
      controller[`${(a)}`]
        .width(width)
        .height(height)
    })
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
    const lapsData = await d3.csv('/laps.csv', d3.autoType) // apparently removing d3.autoType breaks the app lol, i wonder if it would help in the parallel coordinates
    lapsData.forEach(lap => {
      controller.handleAddLap(formatLap(lap))
    })

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

async function updateData () {
  const round = d3.select('.selection').node().value
  try {
    /*
    // Results.csv
    controller.handleDeleteDrivers()
    const results = await d3.csv(`/${round}/results.csv`, d3.autoType)
    console.log(results)
    results.forEach(driver => {
      controller.handleAddDriver(driver)
    })
    */
    // Laps.csv
    console.log('starting laps ...')
    controller.emptyLapList()
    const lapsData = await d3.csv(`/${round}/laps.csv`, d3.autoType).then(laps => {
      laps.forEach(lap => {
        controller.handleAddLap(formatLap(lap))
      })
    }) // apparently removing d3.autoType breaks the app lol, i wonder if it would help in the parallel coordinates

    console.log('finished laps')
    /*
    // Pitstops.csv
    console.log('starting pitstops ...')
    const pitStops = await d3.csv(`/${round}/pitstops.csv`, d3.autoType).then( data => console.log(data) )
    pitStops.forEach(pitStop => {
      console.log(pitStop)
      controller.handleAddPitStop(formatPitStop(pitStop))
    })
    console.log('finished pitstops')

    // _telemetry.csv

    // PCA.csv
    console.log('starting pca')
    const pca = await d3.csv('/PCA.csv')
    pca.forEach(row => {
      controller.handleAddRow(row)
    })
    console.log('done')
    */
  } catch (e) {
    console.error('Error loadData\n', e)
  }
}

init()
