import * as d3 from 'd3'
import { getTeamColor, handleSelection, isSecondDriver, TR_TIME } from '../utils'

export default function () {
  let data = []
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  let title
  const dimensions = {
    width: 100,
    height: 300,
    margin: {
      top: 50,
      right: 10,
      bottom: 30,
      left: 10
    }
  }

  /*
  let selectedDrivers = []
  function onEnter (e, d) {
    // get all the drivers that aren't selected & aren't being hovered
    const driversList = data.data.map(driver => driver.Abbreviation)
      .filter(driver => driver !== d.Abbreviation)
      .filter(elem => !selectedDrivers.includes(elem))
    // for those drivers, set the opacity low
    driversList.forEach(driver => {
      d3.selectAll('.contents').selectAll('#' + driver).style('opacity', 0.1)
      d3.selectAll('.contents').selectAll('#' + d.Abbreviation).raise()
    })
    // for the current element, set the opacity high
    d3.selectAll('#' + d.Abbreviation).style('opacity', 1)
  }

  //
  function onClick (e, d) {
    // If the driver is already selected, un-select him
    if (selectedDrivers.includes(d.Abbreviation)) {
      // remove driver from array
      selectedDrivers = selectedDrivers.filter(e => e !== d.Abbreviation)
      // change his status
      d3.select('.drivers_legend').selectAll('#' + d.Abbreviation).attr('selected', 'false')
    } else {
      // Add the clicked driver to selectedDrivers array
      selectedDrivers.push(d.Abbreviation)
      // change the selected status after click
      d3.select('.drivers_legend').selectAll('#' + d.Abbreviation).attr('selected', 'true')
      d3.selectAll('#' + d.Abbreviation).style('opacity', 1)
        .style('pointer-events', 'all')
    }
    // get all the drivers that aren't selected
    const driversList = data.data.map(elem => elem.Abbreviation)
      .filter(elem => !selectedDrivers.includes(elem))
    // for those drivers, set the opacity
    driversList.forEach(driver => {
      // in the drivers_legend it's a bit more vivid
      d3.select('.drivers_legend').selectAll('#' + driver).style('opacity', 0.5)
      d3.selectAll('.contents').selectAll('#' + driver).style('opacity', 0.1)
      // remove pointer events from non selected drivers
        .style('pointer-events', 'none')
    })
    // If there are no more drivers selected
    if (selectedDrivers.length === 0) {
      const driversList = data.data.map(elem => elem.Abbreviation)
      driversList.forEach(driver => {
        d3.selectAll('#' + driver)
          .style('opacity', 1)
          .style('pointer-events', 'all')
      })
    }
  }

  //
  function onLeave (e, d) {
    if (selectedDrivers.length === 0) {
      const driversList = data.data.map(elem => elem.Abbreviation)
      driversList.forEach(driver => {
        d3.selectAll('.contents').selectAll('#' + driver).style('opacity', 1)
      })
    } else {
      const selected = d3.select('.drivers_legend').select('#' + d.Abbreviation).attr('selected')
      d3.select('.drivers_legend').selectAll('#' + d.Abbreviation).style('opacity', selected === 'true' ? 1 : 0.5)
      d3.selectAll('.contents').selectAll('#' + d.Abbreviation).style('opacity', selected === 'true' ? 1 : 0.1)
    }
  }
*/
  function onEnter (e, d) {
    d3.selectAll('#' + d.Abbreviation).style('opacity', 1)
    const dlSelection = data.data.map(driver => driver.Abbreviation)
      .filter(driver => driver !== d.Abbreviation)
      .filter(driver =>
        d3.select('.drivers_legend').select('#' + driver).attr('selected') !== 'true'
      )
    const pcSelection =
        d3.select('.parallel_coordinates_container').select('.contents').selectAll('path[selected = false]')

    // I have to do it like this because i decided to exclude drivers who didn't complete a racing lap to
    // avoid the scale in the parallel coordinates being too skewed, but this also means that sometimes
    // a driver isn't included in the parallel coordinates, so i can't filter them directly and have to rely
    // on a separate selection and filter afterwards based on its contents :)))
    dlSelection.filter(driver => ![...pcSelection].includes(driver))
      .forEach(d => {
        d3.select('.drivers_legend').selectAll('#' + d).style('opacity', 0.5)
        d3.selectAll('.contents').selectAll('#' + d).style('opacity', 0.1)
      })
  }

  function onClick (e, d) {
    const driverClicked = d3.select('.drivers_legend').select('#' + d.Abbreviation)
    if (driverClicked.attr('selected') === 'true') {
      driverClicked.attr('selected', 'false')
    } else {
      driverClicked.attr('selected', 'true')
    }
    handleSelection()
  }

  function onLeave (e, d) {
    const selectedList = d3.select('.drivers_legend').selectAll('g[selected = true]')
    if (selectedList.size() === 0) {
      // This is again to handle an edge case, these interactions are making me lose my mind
      handleSelection()
    } else {
      const selected = d3.select('.drivers_legend').select('#' + d.Abbreviation).attr('selected')
      d3.select('.drivers_legend').select('#' + d.Abbreviation).style('opacity', selected === 'true' ? 1 : 0.5)
      d3.selectAll('.contents').selectAll('#' + d.Abbreviation).style('opacity', selected === 'true' ? 1 : 0.1)
    }
  }

  function drivers_legend (selection) {
    selection.each(function () {
      function dataJoin () {
        bounds.selectAll('g')
          .data(d3.sort(d3.sort(data.data, d => isSecondDriver(d.Abbreviation)), d => d.TeamName))
          .join(enterFn, updateFn, exitFn)
      }
      dataJoin()

      function enterFn (sel) {
        const p = sel.append('g')
          .attr('id', d => d.Abbreviation)
          .attr('selected', 'false')
          .style('pointer-events', 'bounding-box') // this might not work outside of chrome, may need to append an invisible rect
          .on('click', (e, d) => onClick(e, d))
          .on('mouseenter', (e, d) => onEnter(e, d))
          .on('mouseleave', (e, d) => onLeave(e, d))

        p.append('text')
          .attr('id', d => d.Abbreviation)
          .attr('x', (d, i) => i % 2 ? dimensions.width / 2 + dimensions.margin.right : dimensions.margin.left)
          .attr('y', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10))
          .text(function (d) { return d.Abbreviation })
          .style('fill', d => getTeamColor(d.TeamName))
          // .style('opacity', d => d.Status !== 'Finished' ? 0.3 : 1)
          .style('font-size', 15)
          .style('font-weight', 500)

        p.append('line')
          .attr('id', d => d.Abbreviation)
          .attr('x1', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.right + 40 : dimensions.margin.left + 40))
          .attr('x2', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.right + 60 : dimensions.margin.left + 60))
          .attr('y1', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10) - 5)
          .attr('y2', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10) - 5)
          .attr('stroke', d => getTeamColor(d.TeamName))
          .attr('stroke-width', 2.5)
          .attr('class', d => isSecondDriver(d.Abbreviation) ? 'dashed' : '')

        p.filter(d => !isSecondDriver(d.Abbreviation)).append('circle')
          .attr('cx', dimensions.margin.left + 60)
          .attr('cy', (d, i) => ((dimensions.height - dimensions.margin.bottom) * i / 10) - 5)
          .attr('r', 5)
          .attr('fill', d => getTeamColor(d.TeamName))
          .attr('id', d => d.driver)
          .style('stroke-width', '1px')
          .style('stroke', '#282828')

        p.filter(d => isSecondDriver(d.Abbreviation)).append('rect')
          .attr('class', 'square')
          .attr('x', d => dimensions.width / 2 + dimensions.margin.right + 60)
          .attr('y', (d, i) => ((dimensions.height - dimensions.margin.bottom) * i / 10) - 10)
          .attr('width', 10) // maybe change this ratio
          .attr('height', 10)
          .attr('fill', d => getTeamColor(d.TeamName))
          .attr('id', d => d.driver)
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
      }
      function updateFn (sel) {
        sel.attr('id', d => d.Abbreviation)
        const text = sel.select('text')
          .attr('id', d => d.Abbreviation)
        text.call(update => update.transition().duration(TR_TIME)
          .attr('id', d => d.Abbreviation)
          .attr('x', (d, i) => i % 2 ? dimensions.width / 2 + dimensions.margin.right : dimensions.margin.left)
          .attr('y', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10))
          .text(function (d) { return d.Abbreviation })
        )

        const line = sel.select('line')
          .attr('id', d => d.Abbreviation)
        line.call(update => update.transition().duration(TR_TIME)
          .attr('x1', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.right + 40 : dimensions.margin.left + 40))
          .attr('x2', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.right + 60 : dimensions.margin.left + 60))
          .attr('y1', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10) - 5)
          .attr('y2', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10) - 5)
          .attr('stroke', d => getTeamColor(d.TeamName))
        )

        bounds.selectAll('circle').transition().duration(TR_TIME)
          .attr('cx', dimensions.margin.left + 60)
          .attr('cy', (d, i) => ((dimensions.height - dimensions.margin.bottom) * i / 10) - 5)

        bounds.selectAll('rect').transition().duration(TR_TIME)
          .attr('x', d => dimensions.width / 2 + dimensions.margin.right + 60)
          .attr('y', (d, i) => ((dimensions.height - dimensions.margin.bottom) * i / 10) - 10)
      }
      function exitFn (sel) {
        const text = sel.select('text')
        text.call(exit => exit.remove())

        const line = sel.select('line')
        line.call(exit => exit.remove())
      }

      updateData = function () {
        dataJoin()
      }
      updateWidth = function () {
        title.transition().duration(TR_TIME)
          .attr('x', dimensions.width / 2)
        // dataJoin()
      }
      updateHeight = function () {
        svg
          .attr('height', dimensions.height)
        dataJoin()
      }
    })
  }

  drivers_legend.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return drivers_legend
  }
  drivers_legend.width = function (_) {
    if (!arguments.length) return dimensions.width
    dimensions.width = _
    if (typeof updateWidth === 'function') updateWidth()
    return drivers_legend
  }
  drivers_legend.height = function (_) {
    if (!arguments.length) return dimensions.height
    dimensions.height = _
    if (typeof updateHeight === 'function') updateHeight()
    return drivers_legend
  }
  drivers_legend.initChart = function (selection) {
    svg = selection.append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    title = svg.append('text')
      .text('Drivers')
      .attr('x', dimensions.width / 2)
      .attr('y', 15)
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')

    bounds = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

    return { svg, bounds }
  }
  return drivers_legend
}
