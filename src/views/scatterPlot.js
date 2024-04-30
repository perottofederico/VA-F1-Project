import * as d3 from 'd3'
import { getTeamColor, isSecondDriver, TR_TIME } from '../utils'

export default function () {
  let data = []
  const xAccessor = d => parseFloat(d.PC1)// for some reason PC1 and PC2 are treated as strings, so i need to parse them.
  const yAccessor = d => parseFloat(d.PC2) // should move this conversion to a model file maybe
  let updateData
  let updateWidth
  let updateHeight
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
      bottom: 30,
      left: 30
    }
  }

  //
  function scatterPlot (selection) {
    selection.each(function () {
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data.data, xAccessor))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data.data, yAccessor))
        .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])

      //
      xAxisContainer.call(d3.axisBottom(xScale))
      yAxisContainer.call(d3.axisLeft(yScale))

      //
      function dataJoin () {
        bounds.selectAll('circle')
          .data(data.data.filter(d => !isSecondDriver(d.Driver)))
          .join(enterCircleFn, updateCircleFn, exitCircleFn)
        bounds.selectAll('.square')
          .data(data.data.filter(d => isSecondDriver(d.Driver)))
          .join(enterSquareFn, updateSquareFn, exitSquareFn)
      }
      dataJoin()

      //
      function enterCircleFn (sel) {
        sel.append('circle')
          .attr('cx', d => xScale(parseFloat(d.PC1)))
          .attr('cy', d => yScale(parseFloat(d.PC2)))
          .attr('r', 5) // maybe change this ratio
          .attr('fill', d => getTeamColor(d.Team))
          .attr('id', d => d.Driver)
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
      }
      function updateCircleFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('cx', d => xScale(parseFloat(d.PC1)))
            .attr('cy', d => yScale(parseFloat(d.PC2)))
            .attr('r', 5)
            .attr('stroke', d => getTeamColor(d.Team))
            .attr('fill', d => getTeamColor(d.Team))
            .attr('id', d => d.Driver)
          )
      }
      function exitCircleFn (sel) {
        return sel.call(exit => exit
          .remove())
      }

      //
      function enterSquareFn (sel) {
        sel.append('rect')
          .attr('class', 'square')
          .attr('x', d => xScale(parseFloat(d.PC1)) - 5)
          .attr('y', d => yScale(parseFloat(d.PC2)) - 5)
          .attr('width', 10) // maybe change this ratio
          .attr('height', 10)
          .attr('fill', d => getTeamColor(d.Team))
          .attr('id', d => d.Driver)
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
      }
      function updateSquareFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x', d => xScale(parseFloat(d.PC1)) - 5)
            .attr('y', d => yScale(parseFloat(d.PC2)) - 5)
          )
      }
      function exitSquareFn (sel) {
        return sel.call(exit => exit
          .remove())
      }

      // Atm it's not being used but could be useful so i'm keeping it
      updateData = function () {
        xScale.domain(d3.extent(data.data, xAccessor))
        yScale.domain(d3.extent(data.data, yAccessor))
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
          .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.margin.top})`)

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
          .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height / 2})`)

        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale))
          // .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.margin.top})`)

        dataJoin()
      }
    })
  }

  scatterPlot.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
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
  //
  return scatterPlot
}
