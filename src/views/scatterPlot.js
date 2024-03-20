import * as d3 from 'd3'
import { getTeamColor } from '../utils'

const TR_TIME = 250

export default function () {
  let data = []
  const xAttribute = 'lapNumber'
  const xAccessor = d => parseFloat(d.PC1)
  const yAttribute = 'delta'
  const yAccessor = d => parseFloat(d.PC2)
  let updateData
  let updateXAttribute
  let updateYAttribute
  let updateWidth
  let updateHeight
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    }
  }

  //
  function scatterPlot (selection) {
    selection.each(function () {
      // console.log(typeof data.data[0].PC1) // why is it a string??????????????
      //
      const dom = d3.select(this)

      const wrapper = dom
        .append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)

      //
      const bounds = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      const xAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height / 2})`)
        .classed('scatterplot_xAxisContainer', true)
      const yAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.margin.top})`)
        .classed('scatterplot_yAxisContainer', true)
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
        // Add the dots on top of the linechart
        // I changed the data binding because it's easier this way
        // but i wonder if there's a way to chain the scatter and line plot
        bounds.selectAll('circle')
          .data(data.data)
          .join(enterCircleFn, updateCircleFn, exitCircleFn)
      }
      dataJoin()

      //
      function enterCircleFn (sel) {
        return sel.append('circle')
          .attr('cx', d => xScale(parseFloat(d.PC1)))
          .attr('cy', d => yScale(parseFloat(d.PC2)))
          .attr('r', dimensions.width / 360) // maybe change this ratio
          .attr('stroke', d => getTeamColor(d.Team))
          // .attr('stroke-width', 2)
          .attr('fill', d => getTeamColor(d.Team))
          .attr('id', d => d.Driver)
          .append('text')
          .text('CAPYBARA')
      }
      function updateCircleFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('cx', d => xScale(parseFloat(d.PC1)))
            .attr('cy', d => yScale(parseFloat(d.PC2)))
            .attr('r', dimensions.width / 360)
            .attr('stroke', d => getTeamColor(d.Team))
            .attr('fill', d => getTeamColor(d.Team))
          )
      }
      function exitCircleFn (sel) {
        return sel.call(exit => exit.remove())
      }

      // Atm it's not being used but could be useful so i'm keeping it
      updateData = function () {
        xScale.domain(d3.extent(data.data, xAccessor))
        // xScale.domain(d3.extent(data.lapsCount))
        yScale.domain(d3.extent(data.data, yAccessor))
        // yScale.domain(d3.extent(data.lapTimesMs))
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
        wrapper
          .attr('width', dimensions.width)

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
        wrapper
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
  //

  //
  return scatterPlot
}
