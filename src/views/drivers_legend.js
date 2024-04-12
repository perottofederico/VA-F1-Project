import * as d3 from 'd3'
import { getTeamColor, isSecondDriver, TR_TIME } from '../utils'

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
      right: 20,
      bottom: 30,
      left: 10
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
      function dataJoin () {
        bounds.selectAll('g')
          .data(d3.sort(d3.sort(data.data, d => isSecondDriver(d.Abbreviation)), d => d.TeamName))
          .join(enterFn, updateFn, exitFn)
      }
      dataJoin()

      function enterFn (sel) {
        const p = sel.append('g')
          .attr('id', d => d.Abbreviation)
          .on('click', (e, d) => onTextClick(e, d))
          .on('mouseenter', (e, d) => onTextEnter(e, d))
          .on('mouseleave', (e, d) => onTextLeave(e, d))

        p.append('text')
          .attr('id', d => d.Abbreviation)
          .attr('x', (d, i) => i % 2 ? dimensions.width / 2 + dimensions.margin.left : dimensions.margin.left)
          .attr('y', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10))
          .text(function (d) { return d.Abbreviation })
          .style('fill', d => getTeamColor(d.TeamName))
          .style('opacity', d => d.Status !== 'Finished' ? 0.3 : 1)
          .style('font-size', 15)
          .style('font-weight', 700)

        p.append('line')
          .attr('id', d => d.Abbreviation)
          .attr('x1', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.left + 40 : dimensions.margin.left + 40))
          .attr('x2', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.left + 60 : dimensions.margin.left + 60))
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
          .attr('x', d => dimensions.width / 2 + dimensions.margin.left + 60)
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
          .attr('x', (d, i) => i % 2 ? dimensions.width / 2 + dimensions.margin.left : dimensions.margin.left)
          .attr('y', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10))
          .text(function (d) { return d.Abbreviation })
        )

        const line = sel.select('line')
          .attr('id', d => d.Abbreviation)
        line.call(update => update.transition().duration(TR_TIME)
          .attr('x1', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.left + 40 : dimensions.margin.left + 40))
          .attr('x2', (d, i) => (i % 2 ? dimensions.width / 2 + dimensions.margin.left + 60 : dimensions.margin.left + 60))
          .attr('y1', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10) - 5)
          .attr('y2', (d, i) => ((dimensions.height - dimensions.margin.bottom) * Math.floor(i / 2) / 10) - 5)
          .attr('stroke', d => getTeamColor(d.TeamName))
        )

        bounds.selectAll('circle').transition().duration(TR_TIME)
          .attr('cx', dimensions.margin.left + 60)
          .attr('cy', (d, i) => ((dimensions.height - dimensions.margin.bottom) * i / 10) - 5)

        bounds.selectAll('rect').transition().duration(TR_TIME)
          .attr('x', d => dimensions.width / 2 + dimensions.margin.left + 60)
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
        svg
          .attr('width', dimensions.width < 250 ? dimensions.width : 250)

        title.transition().duration(TR_TIME)
          .attr('x', dimensions.width / 2)
        dataJoin()
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
