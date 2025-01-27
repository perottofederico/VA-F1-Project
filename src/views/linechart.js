import * as d3 from 'd3'
import {
  getTeamColor, isSecondDriver, TR_TIME, trackStatusToColor,
  trackStatusToString
} from '../utils'

export default function () {
  let data = []
  let results = []
  const xAccessor = d => d.lapNumber
  const yAccessor = d => d.delta
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let title
  let bounds
  let clip
  let context
  let contextYAxis
  let xAxisContainer
  let yAxisContainer
  let xGridContainer
  let yGridContainer
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 70,
      right: 250,
      bottom: 30,
      left: 80
    }
  }

  let groupedData = []
  // Tutorials online use an existing div and just change its opacity and position, i wonder if its because of performance?
  function onPointEnter (e, d) {
    d3.select('#root')
      .append('div')
      .attr('class', 'tooltip')
      .style('border', isSecondDriver(d.driver) ? 'dashed' : 'solid')
      .style('border-color', getTeamColor(d.team))
      .style('border-width', '3px')
      .html(`<span style = "color:${getTeamColor(d.team)}; font-weight: 500; font-size: 15;">${d.driver}</span> - Lap #${(d.lapNumber)}
      <br> 
      <span>Lap time: ${d.lapTime ? d.lapTime : 'Not Available'}</span>
      <br>
      <span>Delta: ${d.delta > 0 ? d3.timeFormat('+%M:%S.%L')(d.delta) : d3.timeFormat('-%M:%S.%L')(Math.abs(d.delta))}</span>
      <br>
      <span> position: ${d.position}</span>
    `)
  }
  function onMouseMove (e, d) {
    // IF the margins are wrong the tooltip appears under the mouse, triggering the mouseleave event
    // https://stackoverflow.com/questions/15837650/why-is-my-tooltip-flashing-on-and-off
    d3.select('.tooltip')
      .style('left', (d3.pointer(e)[0]) + 90 + 'px')
      .style('top', (d3.pointer(e)[1]) + 40 + 'px')
  }
  function onPointLeave (e, d) {
    d3.selectAll('.tooltip').remove()
    d3.selectAll('circle')
      .attr('opacity', 1)
    d3.select('g').selectAll('path')
      .attr('opacity', 1)
  }

  // There's for sure a better way to do this (and the other views)
  function linechart (selection) {
    selection.each(function () {
      linechart.computeGraphData(data.data)
      // the 'results' data are ordered in finishing order, so the winner will be at index 0
      const winner = results.data[0].Abbreviation

      //
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data.data, xAccessor))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
      const yScale = d3.scaleLinear()
        .domain(d3.extent(data.data, yAccessor))
        .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])

      //
      xAxisContainer
        .transition().duration(TR_TIME)
        .call(d3.axisBottom(xScale))
      yAxisContainer
        .transition().duration(TR_TIME)
        .call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))

      const zoom = d3.zoom()
        .extent([[0, 0], [dimensions.width, dimensions.height]])
        .scaleExtent([1, 25])
        .translateExtent([[0, 0], [dimensions.width, dimensions.height]])
        .on('zoom', handleZoom)

      function handleZoom (e) {
        const t = e.transform
        yScale.domain(t.rescaleY(contextYScale).domain())
        updateNoTr()
        yAxisContainer.call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))
        if (e.sourceEvent) {
          context.call(brush.move, yScale.range().map(t.invertY, t))
        }
      }
      bounds.call(zoom)

      //
      function dataJoin () {
        // Add rectangles to represent track status
        bounds.selectAll('.trackStatus')
          .data(groupedData.get(winner).filter(lap => lap.trackStatus !== 1))
          .join(enterTrackStatus, updateTrackStatus, exitTrackStatus)

        //
        let trackStatuses = [...new Set(groupedData.get(winner).filter(lap => lap.trackStatus !== 1).map(d => d.trackStatus % 10))]
        // This takes care of an edge case
        // trackStatus = 7 means VSC ending, but usually (not always) i already have the number for VSC (6) in the data
        // and so, if both numbers are present, i get two VSCs in the legend
        // Therefore i need to remove one of them
        // there's probably a cleaner way to do this but i can't think of it right now
        if (trackStatuses.includes(6)) {
          trackStatuses = trackStatuses.filter(d => d !== 7)
        }
        svg.selectAll('g.legend')
          .data(trackStatuses, d => d % 10)
          .join(enterLegend, updateLegend, exitLegend)

        // Add grid lines to the chart
        // I tried to do this differently (not enter-update-exit at first &
        // using only one set of functions later) but i couldnt make it work,
        // and this works fine so i'm keeping it
        // xGridlines
        xGridContainer.selectAll('.x-grid-lines')
          .data(xScale.ticks())
          .join(enterXGrid, updateXGrid, exitXGrid)
        // yGridLines
        yGridContainer.selectAll('.y-grid-lines')
          .data(yScale.ticks())
          .join(enterYGrid, updateYGrid, exitYGrid)

        // Add lines to represent deltas
        bounds.selectAll('path')
          .data(groupedData.values(), d => d[0].driver)
          .join(enterFn, updateFn, exitFn)

        // Add circles for each lap of 'first' drivers
        bounds.selectAll('g.circles')
          .data(groupedData.values().filter(d => !isSecondDriver(d.driver)))
          .join('g')
          .attr('class', 'circles')
          .attr('id', d => d[0].driver)
          .selectAll('circle')
          .data(d => d)
          .join(enterCircleFn, updateCircleFn, exitCircleFn)
        // Add squares for each lap of 'second' drivers
        bounds.selectAll('g.squares')
          .data(groupedData.values().filter(d => isSecondDriver(d[0].driver)), d => (d[0].driver))
          .join('g')
          .attr('class', 'squares')
          .attr('id', d => d[0].driver)
          .selectAll('rect.square')
          .data(d => d)
          .join(enterSquare, updateSquare, exitSquare)

        // after updating, some elements ended up behind new elements (i.e. new rectangles)
        // this re-inserts each selected element, in order, as the first child of its parent
        // i.e. it puts the track status rectangles in the background.
        // another solution could be to lower the opacity
        bounds.selectAll('.trackStatus').lower()
      }
      dataJoin()

      // Rectangles to represent the track status
      function enterTrackStatus (sel) {
        return sel.append('rect')
          .attr('x', d => xScale(d.lapNumber))
          .attr('y', 0)
          .attr('width', xScale(2))
          .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top)
          .attr('class', 'trackStatus')
          .style('opacity', 1)
          .style('fill', d => trackStatusToColor(d.trackStatus))
      }
      function updateTrackStatus (sel) {
        return sel
          .call(update => update// .transition().duration(TR_TIME)
            .attr('x', d => xScale(d.lapNumber))
            .attr('width', xScale(2))
            .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top)
            .style('fill', d => trackStatusToColor(d.trackStatus))
          )
      }
      function exitTrackStatus (sel) {
        return sel.call(exit => exit
          .remove())
      }

      // horizontal grid lines
      function enterXGrid (sel) {
        return sel.append('line')
          .attr('class', 'x-grid-lines')
          .attr('x1', d => xScale(d))
          .attr('x2', d => xScale(d))
          .attr('y1', 0)
          .attr('y2', dimensions.height - dimensions.margin.top - dimensions.margin.bottom)
          .style('pointer-events', 'none')
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
      // vertical grid lines
      function enterYGrid (sel) {
        return sel.append('line')
          .attr('class', 'y-grid-lines')
          .attr('x1', 0)
          .attr('x2', dimensions.width - dimensions.margin.right - dimensions.margin.left)
          .attr('y1', d => yScale(d))
          .attr('y2', d => yScale(d))
          .style('pointer-events', 'none')
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

      // lines
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

      // circles
      function enterCircleFn (sel) {
        sel.append('circle')
          .attr('lap', d => d.lapNumber)
          .attr('cx', d => xScale(d.lapNumber))
          .attr('cy', d => yScale(d.delta))
          .attr('r', dimensions.width / 360) // maybe change this ratio
          .attr('fill', d => getTeamColor(d.team))
          .attr('id', d => d.driver)
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
          .on('mouseenter', (e, d) => onPointEnter(e, d))
          .on('mousemove', (e, d) => onMouseMove(e, d))
          .on('mouseleave', (e, d) => onPointLeave(e, d))
      }
      function updateCircleFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('cx', d => xScale(d.lapNumber))
            .attr('cy', d => yScale(d.delta))
            .attr('r', dimensions.width / 360)
            .attr('fill', d => getTeamColor(d.team))
            .attr('id', d => d.driver)
          )
      }
      function exitCircleFn (sel) {
        return sel.call(exit => exit.remove())
      }
      // squares
      function enterSquare (sel) {
        sel.append('rect')
          .attr('class', 'square')
          .attr('lap', d => d.lapNumber)
          .attr('x', d => xScale(d.lapNumber) - dimensions.width / 360)
          .attr('y', d => yScale(d.delta) - dimensions.width / 360)
          .attr('width', dimensions.width / 180) // maybe change this ratio
          .attr('height', dimensions.width / 180)
          .attr('stroke', d => getTeamColor(d.team))
          .attr('stroke-width', 2)
          .attr('fill', d => getTeamColor(d.team))
          .attr('id', d => d.driver)
          .style('stroke-width', '1px')
          .style('stroke', '#282828')
          .on('mouseenter', (e, d) => onPointEnter(e, d))
          .on('mousemove', (e, d) => onMouseMove(e, d))
          .on('mouseleave', (e, d) => onPointLeave(e, d))
      }
      function updateSquare (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('x', d => xScale(d.lapNumber) - dimensions.width / 360)
            .attr('y', d => yScale(d.delta) - dimensions.width / 360)
            .attr('width', dimensions.width / 180) // maybe change this ratio
            .attr('height', dimensions.width / 180)
            .attr('stroke', d => getTeamColor(d.team))
            .attr('fill', d => getTeamColor(d.team))
            .attr('id', d => d.driver)
          )
          // after updating, some circles ended up behind new elements such as rectangles
          // this re-inserts each selected element, in order, as the last child of its parent
          // but kinda breaks the transition :c
          // .raise()
      }
      function exitSquare (sel) {
        return sel.call(exit => {
          exit.remove()
        })
      }

      // TrackStatusLegend
      function enterLegend (sel) {
        const g = sel.append('g')
          .attr('class', 'legend')
          .attr('id', d => d % 10)
        g.append('rect')
          .attr('x', (_d, i) => dimensions.margin.left + 150 * i)
          .attr('y', 25)
          .attr('width', 30)
          .attr('height', 20)
          .style('opacity', 1)
          .style('fill', d => trackStatusToColor(d))
        g.append('text')
          .attr('x', (_d, i) => dimensions.margin.left + 150 * i + 35)
          .attr('y', 40)
          .text(d => ' = ' + trackStatusToString(d))
          .style('fill', 'white')
      }
      function updateLegend (sel) {
        sel.attr('id', d => d % 10)
        const rect = sel.select('rect')
        rect.call(update => update.transition().duration(TR_TIME)
          .attr('x', (_d, i) => dimensions.margin.left + 150 * i)
          .attr('y', 25)
          .attr('width', 30)
          .attr('height', 20)
          .style('fill', d => trackStatusToColor(d))
        )
        const text = sel.select('text')
        text.call(update => update.transition().duration(TR_TIME)
          .attr('x', (_d, i) => dimensions.margin.left + 150 * i + 35)
          .attr('y', 40)
        )
      }
      function exitLegend (sel) {
        sel.call(exit => exit.remove())
      }

      // Update function without transitions to handle zooming, as the duration makes zooming feel sluggish
      function updateNoTr () {
        xGridContainer.selectAll('.x-grid-lines')
          .call(update => update
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', dimensions.height - dimensions.margin.top - dimensions.margin.bottom)
          )

        yGridContainer.selectAll('.y-grid-lines')
          .data(yScale.ticks())
          .join(
            enter => enter.append('line')
              .attr('class', 'y-grid-lines')
              .attr('x1', 0)
              .attr('x2', dimensions.width - dimensions.margin.right - dimensions.margin.left)
              .attr('y1', d => yScale(d))
              .attr('y2', d => yScale(d)),
            update => update
              .attr('x1', 0)
              .attr('x2', dimensions.width - dimensions.margin.right - dimensions.margin.left)
              .attr('y1', d => yScale(d))
              .attr('y2', d => yScale(d)),
            exitYGrid)

        yGridContainer.selectAll('.y-grid-lines')
          .call(update => update
            .attr('x1', 0)
            .attr('x2', dimensions.width - dimensions.margin.right - dimensions.margin.left)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
          )

        bounds.selectAll('path')
          .call(update => update
            .attr('d', d3.line()
              .defined(d => !isNaN(d.delta))
              .x(d => xScale(d.lapNumber))
              .y(d => yScale(d.delta))
            )
          )

        bounds.selectAll('circle')
          .call(update => update
            .attr('cx', d => xScale(d.lapNumber))
            .attr('cy', d => yScale(d.delta))
          // .attr('r', dimensions.width / 360)
            .attr('stroke', d => getTeamColor(d.team))
            .attr('fill', d => getTeamColor(d.team))
            .attr('id', d => d.driver)
          )
        // after updating, some circles ended up behind new elements such as rectangles
        // this re-inserts each selected element, in order, as the last child of its parent
        // but kinda breaks the transition :c
          .raise()

        bounds.selectAll('.square')
          .call(update => update
            .attr('x', d => xScale(d.lapNumber) - dimensions.width / 360)
            .attr('y', d => yScale(d.delta) - dimensions.width / 360)
            .attr('width', dimensions.width / 180) // maybe change this ratio
            .attr('height', dimensions.width / 180)
            .attr('stroke', d => getTeamColor(d.team))
            .attr('fill', d => getTeamColor(d.team))
            .attr('id', d => d.driver)
          )
      }

      // Context chart
      const contextXScale = d3.scaleLinear()
        .domain(d3.extent(data.data, xAccessor))
        .range([0, 150])
      const contextYScale = d3.scaleLinear()
        .domain(d3.extent(data.data, yAccessor))
        .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])

      contextYAxis
        .call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))

      function dataJoinContext () {
        context.selectAll('path')
          .data(groupedData.values(), d => d[0].driver)
          .join(enter, update, exit)
      }
      function enter (sel) {
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
            .x(d => contextXScale(d.lapNumber))
            .y(d => yScale(d.delta))
            // .curve(d3.curveCatmullRom.alpha(0.5)) // https://d3js.org/d3-shape/curve
          )
      }
      function update (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('d', d3.line()
              .defined(d => !isNaN(d.delta))
              .x(d => contextXScale(d.lapNumber))
              .y(d => yScale(d.delta))
            )
          )
      }
      function exit (sel) {
        sel.call(exit => exit
          .remove()
        )
      }
      dataJoinContext()

      const brush = d3.brushY()
        .extent([[0, 0], [150, dimensions.height - dimensions.margin.bottom - dimensions.margin.top]])
        .on('start brush end', brushed)
      context
        .call(brush)
        .call(brush.move, contextYScale.range())
      //

      function brushed (e, _d) {
        if (e.selection === null || e.selection[0] === e.selection[1]) {
          context.call(brush.move, yScale.range())
        }
        const s = e.selection || contextYScale.range()
        yScale.domain(s.map(contextYScale.invert, contextYScale))
        yAxisContainer
          .call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))
        if (e.sourceEvent) {
          bounds.call(zoom.transform, d3.zoomIdentity
            .scale((dimensions.height - dimensions.margin.bottom - dimensions.margin.top) / (s[1] - s[0]))
            .translate(0, -s[0]))
        }
      }

      //
      updateData = function (src) {
        xScale.domain(d3.extent(data.data, xAccessor))
        // yScale.domain(d3.extent(data.data, yAccessor))
        yScale.domain([d3.min(groupedData.values(), d => d3.min(d, yAccessor)), d3.max(groupedData.values(), d => d3.max(d, yAccessor))])
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisBottom(xScale))
        yAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))

        if (src === 'barClick') bounds.call(zoom.scaleTo, d3.zoomTransform(svg.node()).k)
        else bounds.call(zoom.transform, d3.zoomIdentity)
        dataJoin()
        dataJoinContext()
      }

      updateWidth = function () {
        xScale.range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])

        svg.attr('width', dimensions.width)

        title.transition().duration(TR_TIME)
          .attr('x', dimensions.width / 2)

        xAxisContainer.transition().duration(TR_TIME)
          .call(d3.axisBottom(xScale))

        //
        context
          .attr('transform', `translate(${dimensions.width - dimensions.margin.right + dimensions.margin.left}, ${dimensions.margin.top})`)
        contextYAxis
          .attr('transform', `translate(${dimensions.width - dimensions.margin.right + dimensions.margin.left}, ${dimensions.margin.top})`)
        clip
          .attr('width', dimensions.width - dimensions.margin.right)
          .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5)

        dataJoin()
      }

      updateHeight = function () {
        yScale.range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])

        svg.attr('height', dimensions.height)

        xAxisContainer
          .transition().duration(TR_TIME)
          .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        yAxisContainer
          .transition().duration(TR_TIME)
          .call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))

        contextYScale.range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
        contextYAxis
          .transition().duration(TR_TIME)
          .call(d3.axisLeft(yScale).tickFormat(d => d >= 0 ? d3.timeFormat('%M:%S.%L')(d) : d3.timeFormat('- %M:%S.%L')(Math.abs(d))))

        clip
          .attr('width', dimensions.width - dimensions.margin.right)
          .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5)

        dataJoin()
        dataJoinContext()
        brush.extent([[0, 0], [150, dimensions.height - dimensions.margin.bottom - dimensions.margin.top]])
        context
          .call(brush)
          .call(brush.move, yScale.range())
      }
    })
  }

  linechart.data = function (_) {
    if (!arguments.length) return data
    data = _
    // if (typeof updateData === 'function') updateData()
    return linechart
  }
  linechart.results = function (_) {
    if (!arguments.length) return results
    results = _
    // if (typeof updateData === 'function') updateData()
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

    title = svg.append('text')
      .text('Delta to Race Winner')
      .attr('x', dimensions.width / 2)
      .attr('y', 15)
      // move these to scss
      .attr('font-size', '20px')
      .attr('fill', 'white')
      .style('text-anchor', 'middle')

    bounds = svg.append('g')
      .attr('class', 'contents')
      .attr('clip-path', 'url(#clip)')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      .style('pointer-events', 'bounding-box')
    clip = bounds.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', dimensions.width - dimensions.margin.right)
      .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5)
      .attr('x', 0)
      .attr('y', -5)

    context = svg.append('g')
      .attr('class', 'context')
      .attr('transform', `translate(${dimensions.width - dimensions.margin.right + dimensions.margin.left}, ${dimensions.margin.top})`)
    contextYAxis = svg.append('g')
      .attr('class', 'contextYAxis')
      .attr('transform', `translate(${dimensions.width - dimensions.margin.right + dimensions.margin.left}, ${dimensions.margin.top})`)

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
  linechart.computeGraphData = function (laps, src) {
    // Group the data based on the driver and compute the deltas
    groupedData = d3.group(laps, d => d.driver)
    data.computeDeltas(groupedData)
    if (typeof updateData === 'function') updateData(src)
  }
  //
  return linechart
}
