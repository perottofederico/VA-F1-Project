import * as d3 from 'd3'

const TR_TIME = 250

export default function () {
  let data = []
  let xAttribute = 'lapNumber'
  const xAccessor = d => d.lapNumber
  let yAttribute = 'delta'
  const yAccessor = d => d.delta
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
      // console.log(data)
      data.computeDeltas_2(data)

      //
      const dom = d3.select(this)

      const wrapper = dom.append('div')
        .attr('class', 'linechart_graph')
        .append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)

      //
      const bounds = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      const xAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        .classed('linechart_xAxisContainer', true)
      const xGridContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .classed('linechart_xGridContainer', true)
      const yAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .classed('linechart_yAxisContainer', true)
      const yGridContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .classed('linechart_yGridContainer', true)

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

      // Group the data based on the driver
      const groupedData = d3.group(data.data, d => d.driver)
      // console.log(groupedData)

      // Probably there's a better way to do this, but why complicate things
      // Also probably should move this in utils or something like that
      // https://stackoverflow.com/questions/42963770/how-to-use-d3-js-colorscale-to-change-color-based-on-string-values-rather-than-n
      function getTeamColor (teamName) {
        const colors = d3.schemeCategory10
        switch (teamName) {
          case 'Red Bull Racing': return colors[0]
          case 'McLaren': return colors[1]
          case 'Aston Martin': return colors[2]
          case 'Ferrari': return colors[3]
          case 'Mercedes': return colors[4]
          case 'Alfa Romeo': return colors[5]
          case 'Alpine': return colors[6]
          case 'Haas F1 Team': return colors[7]
          case 'AlphaTauri': return colors[8]
          case 'Williams': return colors[9]
        }
      }

      //
      function dataJoin () {
        // Add rectangles to represent track status
        bounds.selectAll('rect')
          .data(groupedData.get('VER').filter(lap => lap.trackStatus !== 1)) // i'm passing the first driver, but should make sure i pass the winner so all laps are considered
          .join(enterTrackStatus, updateTrackStatus, exitTrackStatus)

        // Add lines to represent deltas
        bounds.selectAll('path')
          .data(groupedData.values()) // i used to have d=>d.key() in this but it prevented the graph from updating all the lines for some reason
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

        // .join(enterLegend, updateLegend, exitLegend)
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
          // .attr('class', 'dashed') // find a way to use this for drivers of the same team
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
          .attr('fill', 'white')
          .attr('id', d => d.driver)
          .on('mouseenter', (e, d) => onCircleEnter(e, d))
          .on('mousemove', (e, d) => onMouseMove(e, d))
          .on('mouseleave', (e, d) => onCircleLeave(e, d))
          .append('text')
          .text('CAPYBARA')
      }
      function updateCircleFn (sel) {
        return sel
          .call(update => update.transition().duration(TR_TIME)
            .attr('cx', d => xScale(d.lapNumber))
            .attr('cy', d => yScale(d.delta))
            .attr('r', dimensions.width / 360)
            .attr('stroke', d => getTeamColor(d.team))
            .attr('fill', 'white')
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
      function enterLegend (sel) {}
      function updateLegend (sel) {
      }
      function exitLegend (sel) {}

      // Add an interactive legend
      const legendContainer = d3.select('#linechart_container').append('div')
        .attr('class', 'legend')
        .append('svg')
      console.log(legendContainer.node().getBoundingClientRect().width)
      legendContainer
        .attr('height', dimensions.height)
        .attr('width', legendContainer.node().getBoundingClientRect().width)
        .selectAll('legend')
        .data(groupedData.keys())
        .join('g')
        // .attr('class', 'legend')
        .attr('id', d => d)
        .append('text')
        .attr('x', function (d, i) {
          return 30
        })
        .attr('y', function (d, i) {
          return 30 + i * 20 + dimensions.margin.top
        })
        .text(function (d) { return d })
        .style('fill', function (d) { return '#FFFFFF' }) // getTeamColor(d.team) })
        .style('font-size', 15)
        .on('click', function (e, d) {
          console.log(e)
          console.log(d)
          // is the element currently visible ?
          const currentOpacity = d3.selectAll('#' + d).style('opacity')
          console.log(currentOpacity)
          // Change the opacity: from 0 to 1 or from 1 to 0
          d3.selectAll('#' + d).style('opacity', currentOpacity === '1' ? 0.3 : 1)
        })

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

      updateXAttribute = function () {
        // xScale.domain(data.map(xAccessor))
        xScale.domain(d3.extent(data.lapsCount))
        xAxisContainer.call(d3.axisBottom(xScale))
        dataJoin()
      }

      updateYAttribute = function () {
        // yScale.domain(d3.extent(data, yAccessor))
        yScale.domain(d3.extent(data.deltas))
        // titleContainer.select('text').html(yAttribute.charAt(0).toUpperCase() + yAttribute.slice(1))
        yAxisContainer.call(d3.axisLeft(yScale))
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

        dataJoin()
      }

      updateHeight = function () {
        yScale.range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])
        wrapper
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

  // stuff for constructor (?)
  linechart.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return linechart
  }

  // originally this was for xAcessor. HAd to change it to make it work and make it symmetrical
  // why can't i keep it as before? Check commit on 15/02 later
  linechart.xAttribute = function (_) {
    if (!arguments.length) return xAttribute
    xAttribute = _
    if (typeof updateXAttribute === 'function') updateXAttribute()
    return linechart
  }
  linechart.yAttribute = function (_) {
    if (!arguments.length) return yAttribute
    yAttribute = _
    if (typeof updateYAttribute === 'function') updateYAttribute()
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
  //

  //
  return linechart
}
