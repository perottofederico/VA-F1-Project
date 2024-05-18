import * as d3 from 'd3'
import {
  EPSILON, TR_TIME, getTeamColor, isSecondDriver,
  handleSelection, getContextualData
} from '../utils'

export default function () {
  let laps = []
  let pitStops = []
  let drivers = []
  let telemetry = []
  let graphData = []
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  let title
  let clip
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 70,
      right: 50,
      bottom: 50,
      left: 80
    }
  }

  function mouseMove (event, d) {
    const [x, y] = d3.pointer(event, this)
    const circles = bounds.selectAll('circle[axis=' + d + ']')
    const squares = bounds.selectAll('rect[axis=' + d + ']')

    squares.each(elem => {
      const square = bounds.select('rect#' + elem.driver + '[axis =' + d + ']')
      const squareY = parseFloat(square.attr('y'))
      const width = parseFloat(square.attr('width'))
      const height = parseFloat(square.attr('height'))// always 10
      const opacity = parseFloat(square.style('opacity'))
      if (x >= -width / 2 && x <= width / 2 && y >= squareY && y <= squareY + height && opacity === 1) {
        if (d3.select('.tooltip').empty()) {
          d3.select('#root')
            .append('div')
            .attr('class', 'tooltip')
            .attr('id', elem.driver)
            .style('border', 'dashed')
            .style('border-width', '3px')
            .style('left', event.x + 5 + 'px')
            .style('top', event.y - 50 + 'px')
            .style('border-color', getTeamColor(elem.team))
            .html(`<span style = "color:${getTeamColor(elem.team)}; font-weight: 500; font-size: 15;">${elem.driver}</span>
            <br>  
            ${getContextualData(d, elem)}`
            )
        }
      } else {
        d3.selectAll('.tooltip#' + elem.driver).remove()
      }
    })

    circles.each(elem => {
      const circle = bounds.select('circle#' + elem.driver + '[axis =' + d + ']')
      const cy = parseFloat(circle.attr('cy'))
      const radius = parseFloat(circle.attr('r')) // its always 5
      const opacity = parseFloat(circle.style('opacity'))
      if (x >= -radius && x <= radius && y >= cy - radius && y <= cy + radius && opacity === 1) {
        if (d3.select('.tooltip').empty()) {
          d3.select('#root')
            .append('div')
            .attr('class', 'tooltip')
            .attr('id', elem.driver)
            .style('border', 'solid')
            .style('border-width', '3px')
            .style('left', event.x + 5 + 'px')
            .style('top', event.y - 50 + 'px')
            .style('border-color', getTeamColor(elem.team))
            .html(`<span style = "color:${getTeamColor(elem.team)}; font-weight: 500; font-size: 15;">${elem.driver}</span>
                <br>  
                ${getContextualData(d, elem)}`
            )
        }
      } else {
        d3.selectAll('.tooltip#' + elem.driver).remove()
      }
    })
  }

  function mouseLeave () {
    d3.selectAll('.tooltip').remove()
  }

  function parallel_coordinates (selection) {
    selection.each(async function () {
      //
      parallel_coordinates.computeGraphData(laps.data)

      //
      // Create the different scales for the different metrics
      const metrics = ['AvgLaptime', 'LaptimeConsistency', 'AvgSpeed', 'PitStopTime', 'PositionsGained']
      const yScales = {}
      // I want to have the good results at the top of the scales, so i need to apply
      // different ranges to some axes
      metrics.forEach(m => {
        if (m === 'AvgLaptime' || m === 'PitStopTime') {
          yScales[m] = d3.scaleLinear()
            .domain(d3.extent(graphData, d => d[m]))
            .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
        } else {
          yScales[m] = d3.scaleLinear()
            .domain(d3.extent(graphData, d => d[m]))
            .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
        }
      })

      const xScale = d3.scalePoint()
        .domain(metrics)
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])

      //
      const line = d3.line()
        .x(([metric]) => xScale(metric))
        .y(([metric, value]) => yScales[metric](value))

      // Create brush behaviour
      const brush = d3.brushY()
        // maybe add a little extra on the height for clarity
        .extent([[-25, -5], [25, dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5]])
        .on('end', brushZoom)

      // Brushing zoom function
      function brushZoom ({ selection }, key) {
        const scale = yScales[key]
        if (selection) {
          // Update the domain
          if (key === 'AvgLaptime' || key === 'PitStopTime') {
            scale.domain([scale.invert(selection[0]), scale.invert(selection[1])])
          } else {
            scale.domain([scale.invert(selection[1]), scale.invert(selection[0])])
          }

          // To change the status of the paths outside the brushing windows,
          // i need to compute which paths should still be considered 'selected'
          // i.e. which paths have all their components still inside the domains of all the axes
          // which means:
          // - iterating through all paths.
          // - for each path, check if it falls within the new domain of the axis
          // - repeat for all the axes
          // - if it does for all the axes, then selected = true, otherwise selected = false
          bounds.selectAll('path').each(driver => {
            let selected = true
            metrics.forEach(metric => {
              const range = yScales[metric].domain()
              // comparison with floating point values was giving stupid results :)
              if (driver[metric] <= range[0] - EPSILON || driver[metric] >= range[1] + EPSILON) {
                selected = false
              }
            })
            bounds.select('#' + driver.driver)
              .attr('selected', selected ? 'true' : 'false')
          })
          // call an outside function to handle setting the opacity and interactivity
          handleSelection()

          // Call the axes to apply the updated domain
          // (I know its dumb to retrieve the axis like this, TODO fix by adding an id to the axis and using that to select it, same for resetZoom)
          svg.selectAll('.parallelCoordinates_yAxisContainer')
            .filter(d => d === key)
            .each(function (d) {
              if (d === 'AvgLaptime') {
                d3.select(this)
                  .transition().duration(TR_TIME)
                  .call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
              } else {
                d3.select(this)
                  .transition().duration(TR_TIME)
                  .call(d3.axisLeft().scale(yScales[d]).tickValues(yScales[d].ticks().concat(yScales[d].domain())))
              }
            })
          dataJoin()

          // This removes the grey brush area as soon as the selection has been done
          svg.selectAll('.parallelCoordinates_yAxisContainer')
            .filter(d => d === key)
            .transition().duration(TR_TIME)
            .call(brush.move, null)

          // Add a 'button' to reset zoom, only if there isn't one already for this axis
          if (d3.select('g#' + key).empty()) {
            const g = svg.append('g')
              .attr('id', key)
              .attr('class', 'resetZoomButton')
              .style('pointer-events', 'all')
              .on('click', () => resetZoom(key))

            g.append('rect')
              .attr('x', xScale(key) + dimensions.margin.left - 40)
              .attr('y', dimensions.height - dimensions.margin.bottom + 15)
              .attr('height', 20)
              .attr('width', 80)
              .style('fill', 'none')
              .style('stroke', '#ffffff')

            g.append('text')
              .attr('x', xScale(key) + dimensions.margin.left)
              .attr('y', dimensions.height - 20)
              .text('Reset zoom')
              .style('fill', '#ffffff')
              .style('font-size', 14)
              .style('text-anchor', 'middle')
          }
        }
      }

      // function to reset the zoom (domain) of an axis
      function resetZoom (key) {
        const scale = yScales[key]

        if (key === 'AvgLaptime' || key === 'PitStopTime') {
          scale.domain(d3.extent(graphData, d => d[key]))
        } else {
          scale.domain(d3.extent(graphData, d => d[key]))
        }

        // when resetting the zoom on one of the scales
        // I need to recompute which paths should still be considered 'selected'
        // i.e. which paths have all their components still inside the domains of all the axes
        // which is the same process as in the brushing function
        bounds.selectAll('path').each(driver => {
          let selected = true
          metrics.forEach(metric => {
            const range = yScales[metric].domain()
            if (driver[metric] <= range[0] - EPSILON || driver[metric] >= range[1] + EPSILON) {
              selected = false
            }
          })
          bounds.select('#' + driver.driver)
            .attr('selected', selected ? 'true' : 'false')
            /*
          d3.select('.drivers_legend').selectAll('#' + driver.driver)
            .attr('selected', selected ? 'false' : 'true')
          */
        })
        // call an outside function to handle setting the opacity and interactivity
        handleSelection()

        // see brushZoom explanation
        svg.selectAll('.parallelCoordinates_yAxisContainer')
          .filter(d => d === key)
          .each(function (d) {
            if (d === 'AvgLaptime') {
              d3.select(this)
                .transition().duration(TR_TIME)
                .call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
            } else {
              d3.select(this)
                .transition().duration(TR_TIME)
                .call(d3.axisLeft().scale(yScales[d]).tickValues(yScales[d].ticks().concat(yScales[d].domain())))
            }
          })

        // Remove the button
        d3.selectAll('#' + key + '.resetZoomButton').remove()

        dataJoin()
      }

      // call the y axes
      svg.selectAll('.parallelCoordinates_yAxisContainer')
        .data(metrics)
        .attr('transform', d => `translate(${dimensions.margin.left + xScale((d))}, ${dimensions.margin.top})`)
        .each(function (d) {
          if (d === 'AvgLaptime') {
            d3.select(this).call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
          } else {
            d3.select(this).call(d3.axisLeft().scale(yScales[d]))// .tickValues(yScales[d].ticks().concat(yScales[d].domain())))
          }
          // Add brushing to axes
          d3.select(this)
          // because of brush i put function here test
            .on('mousemove', mouseMove)
            .on('mouseleave', mouseLeave)
            .on('dblclick', () => resetZoom(d))
            .call(brush)
        })

      //
      function dataJoin () {
        bounds.selectAll('g')
          .data(graphData, d => d.driver)
          .join(enter, update, exit)
        handleSelection()
      }
      function enter (sel) {
        const p = sel.append('g')
          .attr('id', d => d.Abbreviation)

        p.append('path')
          .attr('fill', 'none')
          .attr('id', d => d.driver)
          .attr('stroke', d => getTeamColor(d.team))
          .attr('stroke-width', 3.5)
          .attr('class', d => isSecondDriver(d.driver) ? 'dashed' : '')
          .attr('selected', 'true')
          .attr('d', d => line(d3.cross(metrics, [d], (metric, d) => [metric, d[metric]])))

        metrics.forEach(metric => {
          p.filter(d => !isSecondDriver(d.driver)).append('circle')
            .attr('cx', xScale(metric))
            .attr('cy', d => yScales[metric](d[metric]))
            .attr('r', 5)
            .attr('axis', metric)
            .attr('fill', d => getTeamColor(d.team))
            .attr('id', d => d.driver)
            .style('stroke-width', '1px')
            .style('stroke', '#282828')
            .style('pointer-events', 'all')

          p.filter(d => isSecondDriver(d.driver)).append('rect')
            .attr('class', 'square')
            .attr('x', xScale(metric) - 5)
            .attr('y', d => yScales[metric](d[metric]) - 5)
            .attr('width', 10) // maybe change this ratio
            .attr('height', 10)
            .attr('axis', metric)
            .attr('fill', d => getTeamColor(d.team))
            .attr('id', d => d.driver)
            .style('stroke-width', '1px')
            .style('stroke', '#282828')
        })
      }
      function update (sel) {
        sel.attr('id', d => d.Abbreviation)
        const path = sel.select('path')
        path.call(update => update.transition().duration(TR_TIME)
          .attr('d', d => line(d3.cross(metrics, [d], (metric, d) => [metric, d[metric]])))
          .attr('id', d => d.driver)
        )
        metrics.forEach(metric => {
          const circle = sel.select('circle[axis = ' + metric)
          circle.call(update => update.transition().duration(TR_TIME)
            .attr('cx', xScale(metric))
            .attr('cy', d => yScales[metric](d[metric]))
          )

          const square = sel.select('rect[axis = ' + metric)
          square.call(update => update.transition().duration(TR_TIME)
            .attr('x', xScale(metric) - 5)
            .attr('y', d => yScales[metric](d[metric]) - 5)
          )
        })
      }
      function exit (sel) {
        sel.call(exit => exit
          // .transition()
          // .duration(TR_TIME)
          .remove()
        )
      }
      // dataJoin()

      //
      // This is still called once per data updated (laps, drivers, pitstops, telemetry)
      // I should split it into 4 different functions
      updateData = function () {
        // This may look redundant but it keeps the axes correctly placed and visible until the data is ready
        // If I rewrite this, the axes collapse and then expand again
        metrics.forEach(m => {
          if (m === 'AvgLaptime' || m === 'PitStopTime') {
            yScales[m] = d3.scaleLinear()
              .domain(d3.extent(graphData, d => d[m]))
              .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
          } else {
            yScales[m] = d3.scaleLinear()
              .domain(d3.extent(graphData, d => (d[m])))
              .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
          }
        })

        d3.selectAll('.parallelCoordinates_yAxisContainer')
          .each(function (d) {
            if (d === 'AvgLaptime') {
              d3.select(this).call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
            } else {
              d3.select(this).call(d3.axisLeft().scale(yScales[d]))
            }
          })
        dataJoin()
      }
      updateWidth = function () {
        xScale.range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
        svg.attr('width', dimensions.width)
        title.transition().duration(TR_TIME)
          .attr('x', dimensions.width / 2)

        d3.selectAll('.parallelCoordinates_yAxisContainer')
          .each(function () {
            d3.select(this)
              .attr('transform', d => `translate(${dimensions.margin.left + xScale((d))}, ${dimensions.margin.top})`)
              .call(brush)
          })

        d3.selectAll('.resetZoomButton')
          .each(function () {
            const metric = d3.select(this).attr('id')
            d3.select(this).select('rect')
              .transition().duration(TR_TIME)
              .attr('x', xScale(metric) + dimensions.margin.left - 40)
            d3.select(this).select('text')
              .transition().duration(TR_TIME)
              .attr('x', xScale(metric) + dimensions.margin.left)
          })

        d3.select('.clip2').select('rect')
          .attr('width', dimensions.width - dimensions.margin.right - dimensions.margin.left)
          .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5)

        dataJoin()
      }
      updateHeight = function () {
        metrics.forEach(m => {
          if (m === 'AvgLaptime' || m === 'PitStopTime') {
            yScales[m]
              .range([0, dimensions.height - dimensions.margin.top - dimensions.margin.bottom])
          } else {
            yScales[m]
              .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
          }
        })

        svg.attr('height', dimensions.height)

        clip
          .attr('width', dimensions.width - dimensions.margin.right - dimensions.margin.left + 10)
          .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 10)

        d3.selectAll('.resetZoomButton')
          .each(function () {
            d3.select(this).select('rect')
              .transition().duration(TR_TIME)
              .attr('y', dimensions.height - dimensions.margin.bottom + 15)
            d3.select(this).select('text')
              .transition().duration(TR_TIME)
              .attr('y', dimensions.height - 20)
          })

        brush.extent([[-45, -5], [45, dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5]])
        d3.selectAll('.parallelCoordinates_yAxisContainer')
          .each(function (d) {
            if (d === 'AvgLaptime') {
              d3.select(this)
                .transition()
                .duration(TR_TIME)
                .call(d3.axisLeft(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
            } else {
              d3.select(this)
                .transition()
                .duration(TR_TIME)
                .call(d3.axisLeft().scale(yScales[d]))
            }
            d3.select(this).call(brush)
          })

        dataJoin()
      }
    })
  }

  //
  parallel_coordinates.laps = function (_) {
    if (!arguments.length) return laps
    laps = _
    // if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.pitStops = function (_) {
    if (!arguments.length) return pitStops
    pitStops = _
    // if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.drivers = function (_) {
    if (!arguments.length) return drivers
    drivers = _
    // if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.telemetry = function (_) {
    if (!arguments.length) return telemetry
    telemetry = _
    // if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.width = function (_) {
    if (!arguments.length) return dimensions.width
    dimensions.width = _
    if (typeof updateWidth === 'function') updateWidth()
    return parallel_coordinates
  }
  parallel_coordinates.height = function (_) {
    if (!arguments.length) return dimensions.height
    dimensions.height = _
    if (typeof updateHeight === 'function') updateHeight()
    return parallel_coordinates
  }
  parallel_coordinates.initChart = function (selection) {
    //
    svg = selection
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    title = svg.append('text')
      .text('Race Metrics')
      .attr('x', dimensions.width / 2)
      .attr('y', 25)
    // move these to scss
      .attr('font-size', '20px')
      .attr('fill', 'white')
      .style('text-anchor', 'middle')

    bounds = svg.append('g')
      .attr('class', 'contents')
      .attr('clip-path', 'url(#clip2)')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

    clip = bounds.append('defs').append('clipPath')
      .attr('id', 'clip2')
      .append('rect')
      .attr('width', dimensions.width - dimensions.margin.right - dimensions.margin.left + 10)
      .attr('height', dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 10)
      .attr('x', -5)
      .attr('y', -5)

    const metrics = ['AvgLaptime', 'LaptimeConsistency', 'AvgSpeed', 'PitStopTime', 'PositionsGained']

    svg.selectAll('yAxis')
      .data(metrics)
      .enter()
      .append('g')
      .classed('parallelCoordinates_yAxisContainer', true)
      .attr('transform', (d, i) => `translate(${dimensions.margin.left + (i * 20) * dimensions.width / 100}, ${dimensions.margin.top})`)
      .append('text')
      .style('text-anchor', 'middle')
      .attr('y', -9)
      .text(d => d)
      .style('fill', 'white')
      .style('font-size', 12)
  }
  parallel_coordinates.computeGraphData = async function (setOfLaps) {
    // Create an array to contain the computed data
    graphData = []
    // Create an array to store all the telemetry promises
    const telemetryPromises = []

    // Group the laps
    const groupedLaps = d3.group(setOfLaps, d => d.driver)
    groupedLaps.forEach(d => {
      if (d.length > 1) {
      // compute the metrics based on the laps data
        const lapsMetrics = laps.computeMetrics(d)

        // pitstop data uses the last name as identifiers rather than the abbreviation
        // So I use the results data to go from the abbreviation to the last name of each driver
        // and then I compute the pitstop data (i.e. total pitstop time)
        const lastName = drivers.data.find(n => n.Abbreviation === d[0].driver).LastName
        const pitStopsMetrics = pitStops.computeMetrics(lastName)

        // Compute the metrics based on the results (positions gained / lost)
        const resultsMetrics = drivers.computeMetrics(lastName)

        // Compute the metrics based on the telemetry (avg speed)
        // The telemetry of each car is saved in a file named based on the driver's number
        // This is because originally the data is in a dictionary of dataframes, where the driver's number is the key
        const driverNumber = d[0].driverNumber
        const round = d3.select('.selection').node().value
        telemetryPromises.push(d3.csv(`./data/${round}/${driverNumber}_telemetry.csv`, d3.autoType).then(telemetryData => {
          return telemetry.computeMetrics(telemetryData, Date.parse(d[0].lapStartDate), Date.parse(d[d.length - 1].lapStartDate))
        }))

        // Push the computed data to the array (except for the promises)
        graphData.push({
          driver: d[0].driver,
          driverNumber: d[0].driverNumber,
          team: d[0].team,
          AvgLaptime: lapsMetrics.avgLaptime,
          LaptimeConsistency: lapsMetrics.laptimeConsistency,
          PitStopTime: pitStopsMetrics,
          AvgSpeed: 0,
          startingPos: resultsMetrics.startingPos,
          finishingPos: resultsMetrics.finishingPos,
          PositionsGained: resultsMetrics.result
        })
      }
    })
    // Resolve the promises and update the value
    const avgspeeds = await Promise.all(telemetryPromises)
    avgspeeds.forEach((avgSpeed, i) => {
      graphData[i].AvgSpeed = avgSpeed
    })
    updateData()
  }

  //
  return parallel_coordinates
}
