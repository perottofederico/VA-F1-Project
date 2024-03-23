import * as d3 from 'd3'
import { getTeamColor, isSecondDriver } from '../utils'

const TR_TIME = 500

export default function () {
  let data = []
  let results = []
  const xAccessor = d => d.lapNumber
  const yAccessor = d => d.delta
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  let xAxisContainer
  let yAxisContainer
  let xGridContainer
  let yGridContainer
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

  // Tutorials online use an existing div and just change its opacity, wonder if its because of performance?
  function onCircleEnter (e, d) {
    d3.select('#root')
      .append('div')
      .attr('class', 'tooltip')
      .text('Driver: ' + d.driver + ' \nDelta: ' + (d.delta / 1000) + 's')

    d3.selectAll('circle')
      .filter((d, i) => (d !== e.target.__data__)) // There's no way this is the best way to do this lol
      .attr('opacity', 0.4)

    // DO it better for the love of god
    const id = (d3.select(`#${d.driver}`)) // gets the path i want to highlight
    const datum = (id._groups[0][0].__data__) // AGAIN there's no way this is correct lol
    d3.select('g').selectAll('path')
      .filter(p => p !== datum)
      .attr('opacity', 0.4)
  }

  function onMouseMove (e, d) {
    // IF the margins are wrong the tooltip appears under the mouse, triggering the mouseleave event
    // https://stackoverflow.com/questions/15837650/why-is-my-tooltip-flashing-on-and-off
    d3.select('.tooltip')
      .style('left', (d3.pointer(e)[0]) + dimensions.margin.left + dimensions.margin.right + 'px')
      .style('top', (d3.pointer(e)[1]) + dimensions.margin.top + dimensions.margin.bottom + 'px')
  }

  function onCircleLeave (e, d) {
    d3.selectAll('.tooltip').remove()
    d3.selectAll('circle')
      .attr('opacity', 1)
    d3.select('g').selectAll('path')
      .attr('opacity', 1)
  }

  function onLineEnter (e, d) {
    d3.select('g').selectAll('path')
      .filter((d, i) => (d !== e.target.__data__)) // There's no way this is the best way to do this lol
      .attr('opacity', 0.4)
    d3.selectAll('circle')
      .filter((d, i) => d.driver !== e.target.id)
      .attr('opacity', 0.4)
    console.log(e.target.id)
  }
  function onLineLeave (e, d) {
    d3.select('g').selectAll('path')
      .attr('opacity', 1)
    d3.selectAll('circle')
      .attr('opacity', 1)
  }

  //
  function linechart (selection) {
    selection.each(function () {
      // Group the data based on the driver
      const groupedData = d3.group(data.data, d => d.driver)
      data.computeDeltas(groupedData)
      // the results are ordered in finishing order, so the winner will be at index 0
      const winner = results.data[0].Abbreviation
      //
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data.data, xAccessor))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
      const yScale = d3.scaleLinear()
        // .domain([0, 12000])
        .domain(d3.extent(data.data, yAccessor))
        .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])

      //
      xAxisContainer.call(d3.axisBottom(xScale))
      yAxisContainer.call(d3.axisLeft(yScale).tickFormat(d3.timeFormat('%M:%S.%L')))

      //
      function dataJoin () {
        const groupedData = d3.group(data.data, d => d.driver)
        // Add rectangles to represent track status
        bounds.selectAll('rect')
          .data(groupedData.get(winner).filter(lap => lap.trackStatus !== 1)) // i'm passing the first driver, but should make sure i pass the winner so all laps are considered
          .join(enterTrackStatus, updateTrackStatus, exitTrackStatus)

        // Add lines to represent deltas
        bounds.selectAll('path')
          .data(groupedData.values(), d => d[0].driver)
          .join(enterFn, updateFn, exitFn)

        // Add the dots on top of the linechart
        // I changed the data binding because it's easier this way
        // but i wonder if there's a way to chain the scatter and line plot
        bounds.selectAll('circle')
          .data(data.data)
          .join(enterCircleFn, updateCircleFn, exitCircleFn)

        // Add grid lines to the chart
        // I tried to do this differently (not enter-update-exit first &
        // using only one set of functions later) but i couldnt do it,
        // and this works fine so i'm keeping it
        // xGridlines
        xGridContainer.selectAll('.x-grid-lines')
          .data(xScale.ticks())
          .join(enterXGrid, updateXGrid, exitXGrid)
        // yGridLines
        yGridContainer.selectAll('.y-grid-lines')
          .data(yScale.ticks())
          .join(enterYGrid, updateYGrid, exitYGrid)
      }
      dataJoin()

      //
      function enterTrackStatus (sel) {
        return sel.append('rect')
          .attr('x', d => xScale(d.lapNumber))
          .attr('y', 0)
          .attr('width', xScale(2))
          .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top)
          .style('opacity', 0.3)
          .style('fill', d => {
            switch (d.trackStatus % 10) {
              case 2: return d3.schemeSet1[5] // yellow for yellow flag
              case 4: return d3.schemeSet1[4] // orange for safety car
              case 5: return d3.schemeSet1[0] // red for red flag
              case 6: return 'white' // white for VSC
              case 7: return 'white' // white for VSC (ending)
              // This cases aren't considered, but could be done using a gradient
              case 24: return d3.schemeSet1[4]
              case 25: return d3.schemeSet1[0]
              case 45: return d3.schemeSet1[0]
              case 67: return 'white'
            }
          })
      }
      function updateTrackStatus (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x', d => xScale(d.lapNumber))
            .attr('width', xScale(2))
            .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top)
          )
      }
      function exitTrackStatus (sel) {
        return sel.call(exit => exit.remove())
      }

      //
      function enterFn (sel) {
        return sel.append('path')
          .attr('fill', 'none')
          .attr('stroke-width', 2.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('class', d => isSecondDriver(d[0].driver) ? 'dashed' : '') // find a way to use this for drivers of the same team
          // .style('mix-blend-mode', 'multiply')
          .attr('stroke', d => getTeamColor(d[0].team)) // I'm using d[0] to get the property i want from the first lap in the intern map
          .attr('id', d => d[0].driver)
          .attr('d', d3.line()
            .defined(d => !isNaN(d.delta)) // gets rid of errors, which come from drivers not completing a lap (crashing or dnfs)
            .x(d => xScale(d.lapNumber))
            .y(d => yScale(d.delta))
            // .curve(d3.curveCatmullRom.alpha(0.5)) // https://d3js.org/d3-shape/curve
          )
          .on('mouseenter', (e, d) => onLineEnter(e, d))
          .on('mouseleave', (e, d) => onLineLeave(e, d))
      }
      function updateFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('d', d3.line()
              .defined(d => !isNaN(d.delta))
              .x(d => xScale(d.lapNumber))
              .y(d => yScale(d.delta))
            )
          )
      }
      function exitFn (sel) {
        sel.call(exit => exit
          // .transition()
          // .duration(TR_TIME)
          .remove()
        )
      }

      //
      function enterCircleFn (sel) {
        return sel.append('circle')
          .attr('cx', d => xScale(d.lapNumber))
          .attr('cy', d => yScale(d.delta))
          .attr('r', dimensions.width / 360) // maybe change this ratio
          .attr('stroke', d => getTeamColor(d.team))
          .attr('stroke-width', 2)
          .attr('fill', d => getTeamColor(d.team))
          .attr('id', d => d.driver)
          .on('mouseenter', (e, d) => onCircleEnter(e, d))
          .on('mousemove', (e, d) => onMouseMove(e, d))
          .on('mouseleave', (e, d) => onCircleLeave(e, d))
      }

      function updateCircleFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('cx', d => xScale(d.lapNumber))
            .attr('cy', d => yScale(d.delta))
            .attr('r', dimensions.width / 360)
            .attr('stroke', d => getTeamColor(d.team))
            .attr('fill', d => getTeamColor(d.team))
          )
      }
      function exitCircleFn (sel) {
        return sel.call(exit => exit.remove())
      }

      // linechart_xGridContainer
      function enterXGrid (sel) {
        return sel.append('line')
          .attr('class', 'x-grid-lines')
          .attr('x1', d => xScale(d))
          .attr('x2', d => xScale(d))
          .attr('y1', 0)
          .attr('y2', dimensions.height - dimensions.margin.top - dimensions.margin.bottom)
      }
      function updateXGrid (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', dimensions.height - dimensions.margin.top - dimensions.margin.bottom)
          )
      }
      function exitXGrid (sel) {
        return sel.call(exit => exit.remove())
      }

      function enterYGrid (sel) {
        return sel.append('line')
          .attr('class', 'y-grid-lines')
          .attr('x1', 0)
          .attr('x2', dimensions.width - dimensions.margin.right - dimensions.margin.left)
          .attr('y1', d => yScale(d))
          .attr('y2', d => yScale(d))
      }
      function updateYGrid (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x1', 0)
            .attr('x2', dimensions.width - dimensions.margin.right - dimensions.margin.left)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
          )
      }
      function exitYGrid (sel) {
        return sel.call(exit => exit.remove())
      }

      //
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
        console.log('data updated')
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
        yScale.range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
        svg
          .attr('height', dimensions.height)
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale).tickFormat(d3.timeFormat('%M:%S.%L')))

        dataJoin()
      }
    })
  }

  linechart.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return linechart
  }
  linechart.results = function (_) {
    if (!arguments.length) return results
    results = _
    if (typeof updateData === 'function') updateData()
    return linechart
  }
  linechart.width = function (_) {
    if (!arguments.length) return dimensions.width
    dimensions.width = _
    if (typeof updateWidth === 'function') updateWidth()
    return linechart
  }
  linechart.height = function (_) {
    if (!arguments.length) return dimensions.height
    dimensions.height = _
    if (typeof updateHeight === 'function') updateHeight()
    return linechart
  }
  linechart.initChart = function (selection) {
    svg = selection.append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    bounds = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

    xAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
      .classed('linechart_xAxisContainer', true)
    xGridContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      .classed('linechart_xGridContainer', true)
    yAxisContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      .classed('linechart_yAxisContainer', true)
    yGridContainer = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      .classed('linechart_yGridContainer', true)

    return { svg, bounds, xAxisContainer, xGridContainer, yAxisContainer, yGridContainer }
  }
  //
  return linechart
}
