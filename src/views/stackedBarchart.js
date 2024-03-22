import * as d3 from 'd3'
import { getTeamColor } from '../utils'

const TR_TIME = 500

export default function () {
  let laps = []
  let drivers = []
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  let xAxisContainer
  let yAxisContainer
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 50,
      right: 20,
      bottom: 30,
      left: 80
    }
  }

  function stackedBarchart (selection) {
    selection.each(function () {
      //
      // Compute the data
      const groupedLaps = d3.group(laps.data, d => d.driver)
      const graphData = laps.computeTyreStrategies(groupedLaps)

      const xScale = d3.scaleLinear()
        // domain from 0 to length of the set of laps of the drivers that finished first
        // (results are sorted by finishing order)
        .domain([0, groupedLaps.get(drivers.data[0].Abbreviation).length])
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])

      const yScale = d3.scaleBand()
        .domain(d3.map(d3.sort(drivers.data, d => d.TeamName), d => d.Abbreviation))
        .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
        .padding(0.3)

      //
      xAxisContainer.call(d3.axisBottom(xScale))
      yAxisContainer.call(d3.axisLeft(yScale))

      // Color y axis labels
      d3.select('.stacked_barchart_yAxisContainer')
        .selectAll('.tick text')
        .attr('id', d => d)
        .attr('fill', d => getTeamColor(drivers.getTeam(d)))

      //
      function dataJoin () {
        bounds.selectAll('rect')
          .data(graphData)
          .join(enterRect, updateRect, exitRect)
      }
      dataJoin()
      function enterRect (sel) {
        return sel.append('rect')
          .attr('x', d => xScale(d.lap))
          .attr('y', d => yScale(d.driver))
          .attr('height', yScale.bandwidth())
          .attr('width', d => xScale(d.length))
          .attr('id', d => d.driver)
          .attr('fill', d => {
            if (d.compound === 'SOFT') {
              return 'red'
            }
            if (d.compound === 'MEDIUM') {
              return 'yellow'
            }
            return 'white'
          })
      }
      function updateRect (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x', d => xScale(d.lap))
            .attr('y', d => yScale(d.driver))
            .attr('height', yScale.bandwidth())
            .attr('width', d => xScale(d.length))
          )
      }
      function exitRect (sel) {
        sel.call(exit => exit
          // .transition()
          // .duration(TR_TIME)
          .remove()
        )
      }

      //
      updateData = function () {
        xScale.domain([0, groupedLaps.get(drivers.data[0].Abbreviation).length])
        yScale.domain(d3.map(d3.sort(drivers.data, d => d.TeamName), d => d.Abbreviation))
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisBottom(xScale))
        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale))
        dataJoin()
      }
      updateWidth = function () {
        xScale.range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
        svg
          .attr('width', dimensions.width)

        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisBottom(xScale))

        dataJoin()
      }
      updateHeight = function () {
        yScale.range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
        svg
          .attr('height', dimensions.height)
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale))

        dataJoin()
      }
    })
  }

  stackedBarchart.laps = function (_) {
    if (!arguments.length) return laps
    laps = _
    if (typeof updateData === 'function') updateData()
    return stackedBarchart
  }
  stackedBarchart.drivers = function (_) {
    if (!arguments.length) return drivers
    drivers = _
    if (typeof updateData === 'function') updateData()
    return stackedBarchart
  }
  stackedBarchart.width = function (_) {
    if (!arguments.length) return dimensions.width
    dimensions.width = _
    if (typeof updateWidth === 'function') updateWidth()
    return stackedBarchart
  }
  stackedBarchart.height = function (_) {
    if (!arguments.length) return dimensions.height
    dimensions.height = _
    if (typeof updateHeight === 'function') updateHeight()
    return stackedBarchart
  }
  stackedBarchart.initChart = function (selection) {
    svg = selection.append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
    bounds = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
    xAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
      .classed('stacked_barchart_xAxisContainer', true)
    yAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      .classed('stacked_barchart_yAxisContainer', true)

    return { svg, bounds, xAxisContainer, yAxisContainer }
  }

  return stackedBarchart
}
