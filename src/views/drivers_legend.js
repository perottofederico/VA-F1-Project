import * as d3 from 'd3'
import { getTeamColor } from '../utils'

const TR_TIME = 500

export default function () {
  let data = []
  const xAccessor = d => d.lapNumber
  const yAccessor = d => d.delta
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  const dimensions = {
    width: 100,
    height: 300,
    margin: {
      top: 5,
      right: 60,
      bottom: 30,
      left: 15
    }
  }

  function onTextClick (e, d) {
    // is the element currently visible ?
    const currentOpacity = d3.selectAll('#' + d.Abbreviation).style('opacity')
    // Change the opacity: from 0 to 1 or from 1 to 0
    d3.selectAll('#' + d.Abbreviation).style('opacity', currentOpacity === '1' ? 0.3 : 1)
  }
  function onTextEnter (e, d) {
    // is the element currently visible ?
    const currentOpacity = d3.selectAll('#' + d.Abbreviation).style('opacity')
    // Change the opacity: from 0 to 1 or from 1 to 0
    d3.selectAll('#' + d.Abbreviation).style('opacity', currentOpacity === '1' ? 0.3 : 1)
  }
  function onTextLeave (e, d) {
    // is the element currently visible ?
    const currentOpacity = d3.selectAll('#' + d.Abbreviation).style('opacity')
    // Change the opacity: from 0 to 1 or from 1 to 0
    d3.selectAll('#' + d.Abbreviation).style('opacity', currentOpacity === '1' ? 0.3 : 1)
  }

  function drivers_legend (selection) {
    selection.each(function () {
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data.data, xAccessor))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
      const yScale = d3.scaleLinear()
        .domain(d3.extent(data.data, yAccessor))
        .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])

      function dataJoin () {
        bounds.selectAll('text')
          .data(d3.sort(data.data, d => d.TeamName))
          .join(enterDrivers, updateDrivers, exitDrivers)
      }
      dataJoin()

      //
      function enterDrivers (sel) {
        return sel.append('text')
          .attr('id', d => d.Abbreviation)
          .attr('x', function (d, i) {
            return (i % 2 ? dimensions.width - dimensions.margin.right : dimensions.margin.left)
          })
          .attr('y', function (d, i) {
            // return ((Math.floor(i / 2) * 20) + dimensions.margin.top)
            return (dimensions.height * Math.floor(i / 2) / 10) + dimensions.margin.top
          })
          .text(function (d) { return d.Abbreviation })
          .style('fill', function (d) {
            return (getTeamColor(d.TeamName))
          })
          .style('opacity', d => d.Status !== 'Finished' ? 0.3 : 1)
          .style('font-size', 15)
          .style('font-weight', 700)
          // .style('stroke-width', '0.1%')
          // .style('stroke', 'white')
          .on('click', (e, d) => onTextClick(e, d))
          .on('mouseenter', (e, d) => onTextEnter(e, d))
          .on('mouseleave', (e, d) => onTextLeave(e, d))
      }
      function updateDrivers (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x', function (d, i) {
              return (i % 2 ? dimensions.width - dimensions.margin.right : dimensions.margin.left)
            })
            .attr('y', function (d, i) {
              // return ((Math.floor(i / 2) * 20) + dimensions.margin.top)
              return (dimensions.height * Math.floor(i / 2) / 10) + dimensions.margin.top
            })
          )
      }

      function exitDrivers (sel) {
        sel.call(exit => exit
        // .transition()
        // .duration(TR_TIME)
          .remove()
        )
      }

      updateData = function () {
        xScale.domain(d3.extent(data.data, xAccessor))
        // xScale.domain(d3.extent(data.lapsCount))
        yScale.domain(d3.extent(data.data, yAccessor))
        // yScale.domain(d3.extent(data.lapTimesMs))
        dataJoin()
      }
      updateWidth = function () {
        xScale.range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
        svg
          .attr('width', dimensions.width < 150 ? dimensions.width : 150)
        dataJoin()
      }
      updateHeight = function () {
        yScale.range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
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

    bounds = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

    return { svg, bounds }
  }
  return drivers_legend
}
