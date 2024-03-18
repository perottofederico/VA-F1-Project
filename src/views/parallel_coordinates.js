import * as d3 from 'd3'
import { getTeamColor } from '../utils'
import telemetry from '@/models/telemetry'
import controller from '../controller'

const TR_TIME = 250

export default function () {
  let laps = []
  let pitStops = []
  let drivers = []
  let updateData
  let updateWidth
  let updateHeight
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 30,
      right: 50,
      bottom: 30,
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
        telemetryPromises.push(d3.csv(`./telemetry/${driverNumber}_telemetry.csv`).then(telemetryData => {
          return telemetry.computeMetrics(telemetryData, Date.parse(d[0].lapStartDate))
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
      })
      // Resolve the promises and update the value
      const avgspeeds = await Promise.all(telemetryPromises)
      avgspeeds.forEach((avgSpeed, i) => {
        graphData[i].AvgSpeed = avgSpeed
      })

      //
      //
      const metrics = ['AvgLaptime', 'LaptimeConsistency', 'PitStopTime', 'AvgSpeed', 'PositionsGained']
      const yScales = {}
      metrics.forEach(m => {
        yScales[m] = d3.scaleLinear()
          .domain(d3.extent(graphData, d => (d[m])))
          .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
      })

      //
      const dom = d3.select(this)

      const wrapper = dom
      /*
        .append('div')
        .attr('class', 'parallel_coordinates')
        .attr('id', 'parallel_coordinates')
        */
        .append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)

      const bounds = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      const xScale = d3.scalePoint()
        .domain(metrics)
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])

      /*
        const xAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        .classed('parallelCoordinates_xAxisContainer', true)
      */

      // xAxisContainer.call(d3.axisBottom(xScale)).style('font-size', 12)

      wrapper.selectAll('yAxis')
        .data(metrics)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${dimensions.margin.left + xScale((d))}, ${dimensions.margin.top})`)
        .classed('parallelCoordinates_yAxisContainer', true)
        .each(function (d) {
          if (d === 'AvgLaptime') {
            d3.select(this).call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
          } else {
            d3.select(this).call(d3.axisLeft().scale(yScales[d]))
          }
        })
        .append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text(d => d)
        .style('fill', 'white')
        .style('font-size', 12)

      //
      const line = d3.line()
        .x(([metric]) => xScale(metric))
        .y(([metric, value]) => yScales[metric](value))

      //
      function dataJoin () {
        bounds.selectAll('path')
          .data(graphData)
          .join(enterLine, updateLine, exitLine)
      }
      function enterLine (sel) {
        return sel.append('path')
          .attr('fill', 'none')
          .attr('id', d => d.driver)
          .attr('stroke', d => getTeamColor(d.team))
          .attr('stroke-width', 3.5)
          .attr('d', d => line(d3.cross(metrics, [d], (metric, d) => [metric, d[metric]])))
      }
      function updateLine (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('d', d => line(d3.cross(metrics, [d], (metric, d) => [metric, d[metric]])))
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
        console.log(upda)
        xScale.domain(metrics)
        metrics.forEach(m => {
          yScales[m] = d3.scaleLinear()
            .domain(d3.extent(graphData, d => (d[m])))
        })
        /*
        xAxisContainer
          .transition()
          .duration(TR_TIME)
          .call(d3.axisBottom(xScale))
          */
        d3.selectAll('parallelCoordinates_yAxisContainer')
          .each(function (d) {
            if (d === 'AvgLaptime') {
              d3.select(this).transition()
                .duration(TR_TIME).call(d3.axisLeft().scale(yScales[d]).tickFormat(d3.timeFormat('%M:%S.%L')))
            } else {
              d3.select(this).transition()
                .duration(TR_TIME).call(d3.axisLeft().scale(yScales[d]))
            }
          })
        dataJoin()
      }
      updateWidth = function () {
        xScale.range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
        wrapper
          .attr('width', dimensions.width)

        d3.selectAll('.parallelCoordinates_yAxisContainer')
          .each(function (d) {
            d3.select(this)
              // Transition doesn't work
              .attr('transform', d => `translate(${dimensions.margin.left + xScale((d))}, ${dimensions.margin.top})`)
          })
        dataJoin()
      }
      updateHeight = function () {
        metrics.forEach(m => {
          yScales[m].range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
        })
        wrapper
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

  //
  return parallel_coordinates
}
