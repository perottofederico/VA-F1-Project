import * as d3 from 'd3'
import { getTeamColor, isSecondDriver, TR_TIME, handleSelection } from '../utils'

export default function () {
  let laps = []
  let pitStops = []
  let drivers = []
  let telemetry = []
  let updateData
  let updateWidth
  let updateHeight
  let svg
  let bounds
  let title
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 70,
      right: 50,
      bottom: 20,
      left: 80
    }
  }

  function parallel_coordinates (selection) {
    selection.each(async function () {
      // Create an array to contain the computed data
      const graphData = []

      // Group the laps
      const groupedLaps = d3.group(laps.data, d => d.driver)
      /// Create an array to store all the telemetry promises
      const telemetryPromises = []

      groupedLaps.forEach(d => {
        if (d.length > 1) {
        // compute the metrics based on the laps data
          const lapsMetrics = laps.computeMetrics(d)

          // pitstop data uses the last name as identifiers rather than the abbreviation
          // So I use the results data to go from the abbreviation to the last name of each driver
          // and then I compute their total pitstop time
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
            PositionsGained: resultsMetrics
          })
        }
      })
      // Resolve the promises and update the value
      const avgspeeds = await Promise.all(telemetryPromises)
      avgspeeds.forEach((avgSpeed, i) => {
        graphData[i].AvgSpeed = avgSpeed
      })

      //
      // Create the different scales for the different metrics
      const metrics = ['AvgLaptime', 'LaptimeConsistency', 'PitStopTime', 'AvgSpeed', 'PositionsGained']
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

      /*
        const xAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        .classed('parallelCoordinates_xAxisContainer', true)
      xAxisContainer.call(d3.axisBottom(xScale)).style('font-size', 12)
      */

      // Create brush behaviour
      const selections = new Map()
      const brush = d3.brushY()
        // maybe add a little extra on the height for clarity
        .extent([[-20, -5], [20, dimensions.height - dimensions.margin.bottom - dimensions.margin.top + 5]])
        .on('start brush end', brushed)

      function brushed ({ selection }, key) {
        if (selection === null) selections.delete(key)
        else selections.set(key, selection.map(yScales[key].invert))

        if (!selections.size) {
          d3.select('.parallel_coordinates_container').select('.contents').selectAll('path').style('opacity', 1)
          handleSelection()
        }
        let selected = drivers.data.map(d => d.Abbreviation)
        bounds.selectAll('path').each(function (d) {
          // Since I decided to have different ranges for some axes
          // I also need to adapt the check to the current axis
          let isIncluded
          Array.from(selections)
            .forEach((elem) => {
              if (elem[0] === 'AvgLaptime' || elem[0] === 'PitStopTime') {
                isIncluded = (d[elem[0]] >= elem[1][0] && d[elem[0]] <= elem[1][1])
              } else {
                isIncluded = (d[elem[0]] >= elem[1][1] && d[elem[0]] <= elem[1][0])
              }

              if (!isIncluded && selected.includes(d.driver)) {
                selected = selected.filter(driver => driver !== d.driver)
              }
              d3.select('.parallel_coordinates_container').select('#' + d.driver).attr('selected', selected.includes(d.driver) ? 'true' : 'false')
            })
        })
        // Call a separate function that handles the behavioru of the selected elements
        handleSelection()
      }

      // call the y axes
      svg.selectAll('.parallelCoordinates_yAxisContainer')
        .data(metrics)
        .attr('transform', d => `translate(${dimensions.margin.left + xScale((d))}, ${dimensions.margin.top})`)
        .each(function (d) {
          if (d === 'AvgLaptime') {
            d3.select(this).call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
          } else {
            d3.select(this).call(d3.axisLeft().scale(yScales[d]).tickValues(yScales[d].ticks().concat(yScales[d].domain())))
          }
          // Add brushing to axes
          d3.select(this).call(brush)
        })

      //
      const line = d3.line()
        .x(([metric]) => xScale(metric))
        .y(([metric, value]) => yScales[metric](value))

      //
      function dataJoin () {
        bounds.selectAll('path')
          .data(graphData, d => d.driver)
          .join(enterLine, updateLine, exitLine)
      }
      function enterLine (sel) {
        return sel.append('path')
          .attr('fill', 'none')
          .attr('id', d => d.driver)
          .attr('stroke', d => getTeamColor(d.team))
          .attr('stroke-width', 3.5)
          .attr('class', d => isSecondDriver(d.driver) ? 'dashed' : '')
          .attr('selected', 'false')
          .attr('d', d => line(d3.cross(metrics, [d], (metric, d) => [metric, d[metric]])))
      }
      function updateLine (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('d', d => line(d3.cross(metrics, [d], (metric, d) => [metric, d[metric]])))
            .attr('id', d => d.driver)
          )
      }
      function exitLine (sel) {
        sel.call(exit => exit
          // .transition()
          // .duration(TR_TIME)
          .remove()
        )
      }
      dataJoin()

      //
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
        dataJoin()
      }
      updateHeight = function () {
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
        svg
          .attr('height', dimensions.height)

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
          })
        dataJoin()
      }

      /*
      // Brushing function
      // This works but its pretty laggy, probably due to the amount of loops lol
      function brushed ({ selection }, key) {
        if (selection === null) selections.delete(key)
        else selections.set(key, selection.map(yScales[key].invert))

        let selected = drivers.data.map(d => d.Abbreviation)

        bounds.selectAll('path').each(function (d) {
          // Since I decided to have different ranges for some axes
          // I also need to adapt the check to the current axis
          let isIncluded
          Array.from(selections)
            .forEach((elem) => {
              if (elem[0] === 'AvgLaptime' || elem[0] === 'PitStopTime') {
                isIncluded = (d[elem[0]] >= elem[1][0] && d[elem[0]] <= elem[1][1])
              } else {
                isIncluded = (d[elem[0]] >= elem[1][1] && d[elem[0]] <= elem[1][0])
              }

              if (!isIncluded && selected.includes(d.driver)) {
                selected = selected.filter(driver => driver !== d.driver)
              }
            })
        })
        bounds.selectAll('path').each(function (d) {
          d3.selectAll('#' + d.driver).attr('opacity', !selected.includes(d.driver) ? 0.3 : 1)
        })
      }
      */
    })
  }

  //
  parallel_coordinates.laps = function (_) {
    if (!arguments.length) return laps
    laps = _
    if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.pitStops = function (_) {
    if (!arguments.length) return pitStops
    pitStops = _
    if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.drivers = function (_) {
    if (!arguments.length) return drivers
    drivers = _
    if (typeof updateData === 'function') updateData()
    return parallel_coordinates
  }
  parallel_coordinates.telemetry = function (_) {
    if (!arguments.length) return telemetry
    telemetry = _
    if (typeof updateData === 'function') updateData()
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

    bounds = svg.append('g')
      .attr('class', 'contents')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

    title = svg.append('text')
      .text('Race Metrics')
      .attr('x', dimensions.width / 2)
      .attr('y', 25)
    // move these to scss
      .attr('font-size', '20px')
      .attr('fill', 'white')
      .style('text-anchor', 'middle')

    const metrics = ['AvgLaptime', 'LaptimeConsistency', 'PitStopTime', 'AvgSpeed', 'PositionsGained']

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

  //
  return parallel_coordinates
}
