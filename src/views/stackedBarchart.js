import * as d3 from 'd3'
import { compoundToColor, getTeamColor, isSecondDriver, TR_TIME } from '../utils'

export default function () {
  let laps = []
  let drivers = []
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  let title
  let xAxisContainer
  let yAxisContainer
  let yScale
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 70,
      right: 20,
      bottom: 30,
      left: 40
    }
  }

  let onBarClick = _ => {}

  function mouseover (event, d) {
    d3.select('.stackedBarchart_container')
      .append('div')
      .attr('class', 'tooltip')
      .style('border', isSecondDriver(d.driver) ? 'dashed' : 'solid')
      .style('border-color', getTeamColor(d.team))
      .style('border-width', '3px')
      .html(`<span style = "color:${getTeamColor(d.team)}; font-weight: 500; font-size: 15;">${d.driver}</span> - Stint #${d.stint}
      <br> 
      <span>Laps: ${(d.lap + 1)} to ${(d.lap + d.length)}</span>
      <br> 
      <span> Compound: ${d.compound}</span>
    `)
    /*
    // Highlight corresponding laps in linechart
    const secondDriver = isSecondDriver(d.driver)
    if (secondDriver) {
      const elems = d3.select('.linechart_container').select('.linechart')
        .select('.contents').selectAll('rect#' + d.driver)
      elems.style('opacity', datum =>
        datum.lapNumber >= d.lap && datum.lapNumber <= (d.lap + d.length) ? 1 : 0.1
      )
      // elems.raise()
    } else {
      const elems = d3.select('.linechart_container').select('.linechart')
        .select('.contents').selectAll('circle#' + d.driver)
      elems.style('opacity', datum =>
        datum.lapNumber <= (d.lap + d.length) && datum.lapNumber >= d.lap ? 1 : 0.1
      )
      // elems.raise()
    }
    */
  }
  function mouseleave (event, d) {
    d3.selectAll('.tooltip').remove()
    /*
    const selectedDrivers = drivers.data.map(d => d.Abbreviation)
      .filter(driver => d3.select('.drivers_legend').select('#' + driver).attr('selected') === 'true')
    if (d3.select('.drivers_legend').select('#' + d.driver).attr('selected') === 'true' || selectedDrivers.length === 0) {
      d3.select('.linechart_container').select('.linechart').selectAll('#' + d.driver)
        .style('opacity', 1)
    } else {
      d3.select('.linechart_container').select('.linechart').selectAll('#' + d.driver)
        .style('opacity', 0.1)
    }
    */
  }
  function mousemove (event, d) {
    d3.select('.tooltip')
      .style('left', event.x + 'px')
      .style('top', yScale(d.driver) + dimensions.height + dimensions.margin.bottom - yScale.bandwidth() + 'px')
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

      yScale = d3.scaleBand()
        .domain(d3.map(d3.sort(drivers.data, d => d.TeamName), d => d.Abbreviation))
        .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
        .padding(0.2)

      //
      xAxisContainer.transition().duration(TR_TIME).call(d3.axisBottom(xScale))
      yAxisContainer.call(d3.axisLeft(yScale))

      // Color y axis labels
      d3.select('.stacked_barchart_yAxisContainer')
        .selectAll('.tick text')
        .attr('id', d => d)
        .attr('fill', d => getTeamColor(drivers.getTeam(d)))

      //
      function dataJoin () {
        bounds.selectAll('g.bar')
          .data(graphData)
          .join(enterRect, updateRect, exitRect)

        svg.selectAll('g.legend')
          .data(d3.sort([...new Set(graphData.map(stint => stint.compound).sort())], d => d.length), d => d)
          .join(enterLegend, updateLegend, exitLegend)
      }
      dataJoin()

      //
      function enterRect (sel) {
        const g = sel.append('g')
          .attr('class', 'bar')
          .attr('id', d => d.driver)

        g.append('rect')
          .attr('x', d => xScale(d.lap))
          .attr('y', d => yScale(d.driver))
          .attr('height', yScale.bandwidth())
          .attr('width', d => xScale(d.length))
          .attr('id', d => d.driver)
          .attr('fill', d => compoundToColor(d.compound))
          .attr('selected', 'false')
          .style('stroke', '#282828')
          .style('stroke-width', 2)
          .on('mouseover', mouseover)
          .on('mouseleave', mouseleave)
          .on('mousemove', mousemove)
          .on('click', (e) => onBarClick(e))

        g.append('text').text(d => d.length)
          .attr('x', d => xScale(d.lap) + xScale(d.length) / 2)
          .attr('y', d => yScale(d.driver) + yScale.bandwidth() * 0.8)
          .style('text-anchor', 'middle')
          .style('font-size', yScale.bandwidth() + 'px')
          .style('font-weight', 700)
          .style('pointer-events', 'none')
      }
      function updateRect (sel) {
        sel.attr('id', d => d.driver)

        const rect = sel.select('rect').attr('id', d => d.driver)
        rect.call(update => update.transition().duration(TR_TIME)
          .attr('x', d => xScale(d.lap))
          .attr('y', d => yScale(d.driver))
          .attr('height', yScale.bandwidth())
          .attr('width', d => xScale(d.length))
          .attr('id', d => d.driver)
          .attr('fill', d => compoundToColor(d.compound))
          .style('stroke', '#282828')
          .style('stroke-width', 2)
        )

        const text = sel.select('text')
        text.call(update => update.transition().duration(TR_TIME)
          .text(d => d.length)
          .attr('x', d => xScale(d.lap) + xScale(d.length) / 2)
          .attr('y', d => yScale(d.driver) + yScale.bandwidth() * 0.8)
          .style('font-size', yScale.bandwidth() + 'px')
        )
      }
      function exitRect (sel) {
        sel.call(exit => exit
          .transition()
          .duration(TR_TIME)
          .attr('width', 0)
          .style('opacity', 0)
          .remove()
        )
      }

      //
      function enterLegend (sel) {
        const g = sel.append('g')
          .attr('class', 'legend')
          .attr('id', d => d)

        g.append('rect')
          .attr('x', (d, i) => dimensions.margin.left + 90 * i)
          .attr('y', 45)
          .attr('width', 20)
          .attr('height', yScale.bandwidth())
          .style('opacity', 1)
          .style('fill', d => compoundToColor(d))

        g.append('text')
          .attr('x', (d, i) => dimensions.margin.left + 90 * i + 25)
          .attr('y', 55)
          .text(d => '= ' + d)
          .style('fill', 'white')
          .style('font-size', 12)
      }
      function updateLegend (sel) {
        sel.attr('id', d => d)

        const rect = sel.select('rect')
        rect.call(update => update.transition().duration(TR_TIME)
          .attr('x', (_d, i) => dimensions.margin.left + 90 * i)
          .attr('y', 45)
          .style('fill', d => compoundToColor(d))
        )

        const text = sel.select('text')
        text.call(update => update.transition().duration(TR_TIME)
          .attr('x', (_d, i) => dimensions.margin.left + 90 * i + 25)
          .attr('y', 55)
        )
      }
      function exitLegend (sel) {
        sel.call(exit => exit.remove())
      }

      //
      updateData = function () {
        // Regroup the data because otherwise the xScale domain would reference the old data
        const groupedLaps = d3.group(laps.data, d => d.driver)
        xScale
          .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
          .domain([0, groupedLaps.get(drivers.data[0].Abbreviation).length])
        yScale.domain(d3.map(d3.sort(drivers.data, d => d.TeamName), d => d.Abbreviation))
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisBottom(xScale))
        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale))
        // dataJoin()
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
      .attr('class', 'contents')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
    title = svg.append('text')
      .text('Tyre Strategies')
      .attr('x', dimensions.width / 2)
      .attr('y', 25)
    // move these to scss
      .attr('font-size', '20px')
      .attr('fill', 'white')
      .style('text-anchor', 'middle')

    xAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
      .classed('stacked_barchart_xAxisContainer', true)
    yAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      .classed('stacked_barchart_yAxisContainer', true)

    return { svg, bounds, xAxisContainer, yAxisContainer }
  }

  //
  stackedBarchart.bindBarClick = callback => onBarClick = callback

  return stackedBarchart
}
