import 'normalize.css'
import * as d3 from 'd3'
import './index.scss'
import controller from './controller'
import { formatLap, formatPitStop, getRacesList, resetAllFilters } from './utils'

async function init () {
  window.d3 = d3
  window.app = controller

  // Set up page elements
  setupPage()

  // Wait for data to be loaded
  await updateRace()

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

  const selectMenu = menuContainer
    .append('div')
    .attr('class', 'dropDownRace')
    .html('Select a race: ')
    .style('font-size', '20px')
    .append('select')
    .attr('id', 'selectButton')
    .attr('class', 'selection')
    .on('change', () => updateRace())
  selectMenu.selectAll('option')
    .data(list).enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d.replace('_', ': '))

  // Reset filters button
  menuContainer
    .append('div')
    .attr('class', 'resetButton')
    .append('button')
    .style('left', '100px')
    .style('position', 'relative')
    .text('Reset All Filters')
    .style('font-size', '16px')
    .on('click', resetAllFilters)

  // div for filters
  const filtersDiv = menuContainer.append('div')
    .attr('class', 'filters')

  // slider for minimum laps
  filtersDiv.append('label').text('Minimum Laps: ')
    .style('font-size', '16px')
    .style('left', '10px')
    .style('position', 'relative')
    .attr('class', 'lapsSliderLabel')
  filtersDiv.append('input')
    .attr('type', 'range')
    .attr('class', 'lapsSliderRange')
    .attr('step', 1)
    .attr('value', 1)
    .on('input', _ => d3.select('.lapsSliderValue').text(d3.select('.lapsSliderRange').node().value))
    .on('change', _ => controller.onLapsSliderChange())
  filtersDiv.append('span')
    .attr('class', 'lapsSliderValue')
    .text('1')

  // checkbox for fuel corrected lap times
  filtersDiv.append('label').text('Use Fuel Corrected Lap Times: ')
    .style('font-size', '16px')
    .style('left', '10px')
    .style('position', 'relative')
    .attr('class', 'fuelCorrectionLabel')
  filtersDiv.append('input')
    .attr('type', 'checkbox')
    .attr('class', 'fuelCorrectionCheckbox')
    .on('change', _ => {
      controller.onFuelCorrectionChange(d3.select('.fuelCorrectionCheckbox').property('checked'))
    })

  // Containers for views
  const linechartContainer = d3.select('#root').append('div')
    .attr('class', 'linechart_container')
    .attr('id', 'linechart_container')
    .html('<hr>')
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
    .style('float', 'left')
  const options = ['All Laps', "Drivers' Centroids"]
  const s = scatterPlotContainer.append('div')
    .style('float', 'right')
    .append('select')
    .attr('id', 'scatterPlotSelect')
    .style('margin-top', '10px')
    .style('margin-right', '10px')
    .on('change', () => controller.handleSelectChange(d3.select('#scatterPlotSelect').node().value))
  s.selectAll('option')
    .data(options).enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d)

  controller.scatterPlot
    .width(scatterPlotContainer.node().getBoundingClientRect().width)
    .height(scatterPlotContainer.node().getBoundingClientRect().height)
    .initChart(scatterPlotContainer)
}

async function updateRace () {
  controller.deleteAllData()
  const round = d3.select('.selection').node().value
  try {
    // Update data for selected round
    console.log('Starting data update for round:', round)

    // Results.csv
    const results = await d3.csv(`data/${round}/results.csv`)
    results.forEach(driver => {
      controller.handleAddDriver(driver)
    })

    // Laps.csv
    const lapsData = await d3.csv(`data/${round}/laps.csv`, d3.autoType)
    lapsData.forEach(lap => {
      controller.handleAddLap(formatLap(lap))
    })
    controller.laps.currData = controller.laps.data

    // Pitstops.csv
    const pitStops = await d3.csv(`data/${round}/pitstops.csv`)
    pitStops.forEach(pitStop => {
      controller.handleAddPitStop(formatPitStop(pitStop))
    })

    // PCA.csv
    const pca = await d3.csv(`data/${round}/tSNE.csv`)
    pca.forEach(row => {
      controller.handleAddRow(row)
    })
    console.log('Data update complete')
  } catch (e) {
    console.error('Error updating data\n', e)
  }
  controller.handleRaceChanged()

  resetAllFilters()
  // Reset the select menu in scatterplot to it's first value
  d3.select('#scatterPlotSelect').property('selectedIndex', 0)
  d3.select('.lapsSliderRange')
    .attr('min', 1)
    .attr('max', d3.max(controller.laps.data, d => d.lapNumber) - 1)

  d3.select('.lapsSlider').append('label').text('1')
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
