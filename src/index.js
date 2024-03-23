import 'normalize.css'
import * as d3 from 'd3'
import './index.scss'
import controller from './controller'
import { formatLap, formatPitStop, getRacesList } from './utils'

async function init () {
  window.d3 = d3
  window.app = controller

  // Set up page elements
  setupPage()

  // Wait for data to be loaded
  await updateData()

  // Populate views
  // populateViews()

  // Window resize listener
  window.addEventListener('resize', _ => {
    resizeViews()
  })
}

function setupPage () {
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

  // Containers for views
  const linechartContainer = d3.select('#root').append('div')
    .attr('class', 'linechart_container')
    .attr('id', 'linechart_container')
    .append('div')
    .attr('class', 'linechart')
    .attr('id', 'linechart')
  const { width, height } = linechartContainer.node().getBoundingClientRect()
  controller.linechart
    .width(width)
    .height(height)
    .initChart(linechartContainer)

  const legendContainer = d3.select('#linechart_container').append('div')
    .attr('class', 'drivers_legend')
    .attr('id', 'drivers_legend')
  controller.drivers_legend
    .width(legendContainer.node().getBoundingClientRect().width)
    .height(legendContainer.node().getBoundingClientRect().height)
    .initChart(legendContainer)

  const pcContainer = d3.select('#root').append('div')
    .attr('class', 'parallel_coordinates_container')
    .attr('id', 'parallel_coordinates_container')
  controller.parallel_coordinates
    .width(pcContainer.node().getBoundingClientRect().width)
    .height(pcContainer.node().getBoundingClientRect().height)
    .initChart(pcContainer)

  const stackedBarchartContainer = d3.select('#root').append('div')
    .attr('class', 'stackedBarchart_container')
    .attr('id', 'stackedBarchart_container')
  controller.stackedBarchart
    .width(stackedBarchartContainer.node().getBoundingClientRect().width)
    .height(stackedBarchartContainer.node().getBoundingClientRect().height)
    .initChart(stackedBarchartContainer)

  const scatterPlotContainer = d3.select('#root').append('div')
    .attr('class', 'scatterPlot_container')
    .attr('id', 'scatterPlot_container')
  controller.scatterPlot
    .width(scatterPlotContainer.node().getBoundingClientRect().width)
    .height(scatterPlotContainer.node().getBoundingClientRect().height)
    .initChart(scatterPlotContainer)
}

async function updateData () {
  controller.deleteAllData()
  const round = d3.select('.selection').node().value
  try {
    // Update data for selected round
    console.log('Starting data update for round:', round)

    // Results.csv
    const results = await d3.csv(`/${round}/results.csv`)
    results.forEach(driver => {
      controller.handleAddDriver(driver)
    })

    // Laps.csv
    const lapsData = await d3.csv(`/${round}/laps.csv`, d3.autoType)
    lapsData.forEach(lap => {
      controller.handleAddLap(formatLap(lap))
    })

    // Pitstops.csv
    const pitStops = await d3.csv(`/${round}/pitstops.csv`)
    pitStops.forEach(pitStop => {
      controller.handleAddPitStop(formatPitStop(pitStop))
    })

    // PCA.csv
    const pca = await d3.csv(`/${round}/PCA.csv`)
    pca.forEach(row => {
      controller.handleAddRow(row)
    })
    console.log('Data update complete')
  } catch (e) {
    console.error('Error updating data\n', e)
  }
  controller.handleRaceChanged()
  populateViews()
}

function populateViews () {
  // Legend
  const legendContainer = d3.select('#drivers_legend')
  legendContainer.call(controller.drivers_legend)

  // Linechart
  const linechartContainer = d3.select('#linechart')
  linechartContainer.call(controller.linechart)

  // Parallel Coordinates
  const pcContainer = d3.select('#parallel_coordinates_container')
  pcContainer.call(controller.parallel_coordinates)

  // Stacked Barchart
  const stackedBarchartContainer = d3.select('#stackedBarchart_container')
  stackedBarchartContainer.call(controller.stackedBarchart)

  // Scatterplot
  const scatterPlotContainer = d3.select(('#scatterPlot_container'))
  scatterPlotContainer.call(controller.scatterPlot)
}

function resizeViews () {
  const linechartViews = ['drivers_legend', 'linechart']
  const views = ['parallel_coordinates', 'stackedBarchart', 'scatterPlot']
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
}

init()
