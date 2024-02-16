import 'normalize.css'
import * as d3 from 'd3'

import './index.scss'

import controller from './controller'
import { sentenceString, formatLap } from './utils'

/*
function component() {
    const element = document.createElement('div');

    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML = _.join(['Hello', 'webpack'], ' ');

    return element;
  }

  document.body.appendChild(component());
  index.html
*/

async function init () {
  window.d3 = d3
  window.app = controller
  await loadData()
  const views = ['linechart', 'parallel_coords', 'barchart', 'scatterplot']

  // linechart
  const container = d3.select('#root').append('div')
    .attr('class', 'linechart')
    .attr('id', 'Linechart_container')
  const { width, height } = container.node().getBoundingClientRect()
  controller.linechart
    .xAttribute('lapNumber')
    .yAttribute('delta')
    .width(width)
    .height(height)
  container.call(controller.linechart)
  /*
  views.forEach(a => {
    const container = d3.select('#root').append('div')
      .attr('class', a)
      .attr('id', `${sentenceString(a)}_container`)
    const { width, height } = container.node().getBoundingClientRect()
    // const viewName = `${a}`
    // Lets focus on just the linechart for now
    /* console.log(controller)
    // console.log(controller[viewName])
    controller[viewName]
      .xAccessor(d => console.log(d))
      .yAttribute(a)
      .width(width)
      .height(height)
    container.call(controller[viewName])

    // console.log(controller)
    controller.linechart
      .xAccessor(d => d.LapNumber)
      .yAttribute(a)
      .width(width)
      .height(height)
    container.call(controller.linechart)
  })
  */

  // Lets focus on just the linechart for now
  window.addEventListener('resize', _ => {
    const container = d3.select('#root').select('#Linechart_container')
    const { width, height } = container.node().getBoundingClientRect()
    const viewName = 'linechart'
    controller[viewName]
      .width(width)
      .height(height)
  })
  /*
  window.addEventListener('resize', _ => {
    views.forEach(a => {
      const container = d3.select('#root').select(`#${sentenceString(a)}_container`)
      const { width, height } = container.node().getBoundingClientRect()
      console.log(width + ' ; ' + height)
      // controller[`${(a)}`]
      controller.linechart
        .width(width)
        .height(height)
    })
  })
  */
}

async function loadData () {
  try {
    const data = await d3.csv('/laps.csv', d3.autoType)

    // loop over the data and prepare it !CHECK use foreach?
    for (let i = 0; i < data.length; i++) {
      const lap = formatLap(data[i]) // Not sure i even need this but you know
      controller.handleAddLap(lap)
    }
  } catch (e) {
    console.error('Error loadData\n', e)
  }
}

init()
