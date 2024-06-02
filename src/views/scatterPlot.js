import * as d3 from 'd3'
import { getTeamColor, isSecondDriver, TR_TIME } from '../utils'

export default function () {
  let data = []
  const xAccessor = d => parseFloat(d.dim1)// for some reason dim1 and dim2 are treated as strings, so i need to parse them.
  const yAccessor = d => parseFloat(d.dim2) // should move this conversion to a model file maybe
  let updateData
  let updateWidth
  let updateHeight
  let graphData
  let svg
  let bounds
  let title
  let xAxisContainer
  let yAxisContainer
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 50,
      right: 30,
      bottom: 50,
      left: 30
    }
  }

  function onEnter (e, d) {
    const tooltip = d3.select('#root')
      .append('div')
      .attr('class', 'tooltip')
      .style('border', isSecondDriver(d.Driver) ? 'dashed' : 'solid')
      .style('border-color', getTeamColor(d.Team))
      .style('left', e.x - 50 + 'px')
      .style('top', e.y - 40 + 'px')
      .style('border-width', '3px')
    if (d3.select('#scatterPlotSelect').node().value === 'All Laps') {
      tooltip.html(`<span style = "color:${getTeamColor(d.Team)}; font-weight: 500; font-size: 15;">${d.Driver}</span> 
      - Lap ${parseInt(d.LapNumber)}`)
    } else {
      tooltip.html(`<span style = "color:${getTeamColor(d.Team)}; font-weight: 500; font-size: 15;">${d.Driver}</span>`)
    }
  }
  function onLeave (e, d) {
    d3.selectAll('.tooltip').remove()
  }
  //
  function scatterPlot (selection) {
    selection.each(function () {
      graphData = data.data
      const xScale = d3.scaleLinear()
        .domain(d3.extent(graphData, xAccessor))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])

      const yScale = d3.scaleLinear()
        .domain(d3.extent(graphData, yAccessor))
        .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])

      //
      xAxisContainer
        .attr('transform', `translate(${dimensions.margin.left}, ${yScale(0) + dimensions.margin.top})`)
        .call(d3.axisBottom(xScale))
      yAxisContainer
        .attr('transform', `translate(${xScale(0) + dimensions.margin.left}, ${dimensions.margin.top})`)
        .call(d3.axisLeft(yScale))

      //
      function dataJoin () {
        bounds.selectAll('circle')
          .data(graphData.filter(d => !isSecondDriver(d.Driver)), d => d.LapNumber)
          .join(enterCircleFn, updateCircleFn, exitCircleFn)
        bounds.selectAll('.square')
          .data(graphData.filter(d => isSecondDriver(d.Driver)), d => d.LapNumber)
          .join(enterSquareFn, updateSquareFn, exitSquareFn)
      }
      dataJoin()

      //
      function enterCircleFn (sel) {
        sel.append('circle')
          .attr('id', d => d.Driver)
          .attr('cx', d => xScale(parseFloat(d.dim1)))
          .attr('cy', d => yScale(parseFloat(d.dim2)))
          .attr('r', 5) // maybe change this ratio
          .attr('fill', d => getTeamColor(d.Team))
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
          .on('mouseenter', (e, d) => onEnter(e, d))
          .on('mouseleave', (e, d) => onLeave(e, d))
      }
      function updateCircleFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('id', d => d.Driver)
            .attr('cx', d => xScale(parseFloat(d.dim1)))
            .attr('cy', d => yScale(parseFloat(d.dim2)))
            .attr('r', 5)
            .attr('fill', d => getTeamColor(d.Team))
            .attr('stroke', '#282828')
          )
      }
      function exitCircleFn (sel) {
        return sel.call(exit => exit.remove())
      }

      //
      function enterSquareFn (sel) {
        sel.append('rect')
          .attr('class', 'square')
          .attr('id', d => d.Driver)
          .attr('x', d => xScale(parseFloat(d.dim1)) - 5)
          .attr('y', d => yScale(parseFloat(d.dim2)) - 5)
          .attr('width', 10) // maybe change this ratio
          .attr('height', 10)
          .attr('fill', d => getTeamColor(d.Team))
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
          .on('mouseenter', (e, d) => onEnter(e, d))
          .on('mouseleave', (e, d) => onLeave(e, d))
      }
      function updateSquareFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('id', d => d.Driver)
            .attr('x', d => xScale(parseFloat(d.dim1)) - 5)
            .attr('y', d => yScale(parseFloat(d.dim2)) - 5)
            .attr('fill', d => getTeamColor(d.Team))
          )
      }
      function exitSquareFn (sel) {
        return sel.call(exit => exit.remove())
      }

      // Atm it's not being used but could be useful so i'm keeping it
      updateData = function () {
        xScale.domain(d3.extent(graphData, xAccessor))
        yScale.domain(d3.extent(graphData, yAccessor))
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .attr('transform', `translate(${dimensions.margin.left}, ${yScale(0) + dimensions.margin.top})`)
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
        title.transition().duration(TR_TIME)
          .attr('x', dimensions.width / 2)
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisBottom(xScale))

        yAxisContainer
          // .transition()
          // .duration(TR_TIME)
          // .call(d3.axisLeft(yScale))
          // for some fucking reason the transition doesn't work on this particula g element
          // but it does in updateheight, i'm honestly just fucking tired
          .attr('transform', `translate(${xScale(0) + dimensions.margin.left}, ${dimensions.margin.top})`)

        dataJoin()
      }

      updateHeight = function () {
        yScale.range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
        svg
          .attr('height', dimensions.height)

        xAxisContainer
          .transition()
          .duration(TR_TIME)
        // .call(d3.axisBottom(xScale))
          .attr('transform', `translate(${dimensions.margin.left}, ${yScale(0) + dimensions.margin.top})`)

        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale))
          .attr('transform', `translate(${xScale(0) + dimensions.margin.left}, ${dimensions.margin.top})`)

        dataJoin()
      }
    })
  }

  scatterPlot.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') this.computeGraphData()
    return scatterPlot
  }
  scatterPlot.width = function (_) {
    if (!arguments.length) return dimensions.width
    dimensions.width = _
    if (typeof updateWidth === 'function') updateWidth()
    return scatterPlot
  }
  scatterPlot.height = function (_) {
    if (!arguments.length) return dimensions.height
    dimensions.height = _
    if (typeof updateHeight === 'function') updateHeight()
    return scatterPlot
  }
  scatterPlot.initChart = function (selection) {
    svg = selection
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    //
    bounds = svg.append('g')
      .attr('class', 'contents')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
    title = svg.append('text')
      .text('Dimensionality Reduction')
      .attr('x', dimensions.width / 2)
      .attr('y', 25)
    // move these to scss
      .attr('font-size', '20px')
      .attr('fill', 'white')
      .style('text-anchor', 'middle')

    xAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height / 2})`)
      .classed('scatterplot_xAxisContainer', true)
    yAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.margin.top})`)
      .classed('scatterplot_yAxisContainer', true)
  }
  scatterPlot.computeGraphData = function (d) {
    const value = d3.select('#scatterPlotSelect').node().value
    if (value === 'All Laps') {
      graphData = data.data
    } else {
      graphData = data.computeGraphData(data.data)
    }
    if (typeof updateData === 'function') updateData()
  }
  //
  return scatterPlot
}
