import * as d3 from 'd3'

const TR_TIME = 250

export default function () {
  let data = []
  let deltas = []
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

  //
  function linechart (selection) {
    selection.each(function () {
      // For now I'll put this logic here, even if it shouldn't be
      // I'll worry about moviing it later on.
      // Also, for now i'll assume the winner is already known
      // I just want it to work lol
      const groupedData = d3.group(data.data, d => d.driver)

      function computeDeltas (data) {
        // console.log([...data])
        // Assume winner is VER
        data.forEach(driver => {
          // console.log(driver)
          driver.forEach(lap => {
            // console.log(lap)
            // get same lap number and its laptime from the winner
            const winnerLap = data.get('VER').find(winnerLap => winnerLap.lapNumber === lap.lapNumber)
            const delta = Date.parse(lap.lapStartDate) - Date.parse(winnerLap.lapStartDate)
            // console.log(delta)
            lap.delta = delta
          })
        })
      }
      computeDeltas(groupedData)

      //
      const dom = d3.select(this)

      const wrapper = dom.append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)

      //
      const bounds = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      const xAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.height - dimensions.margin.bottom})`)
        .classed('linechart_xAxisContainer', true)
      const yAxisContainer = wrapper.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
        .classed('linechart_yAxisContainer', true)

      const xScale = d3.scaleLinear()
        .domain(d3.extent(data.data, xAccessor))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
      /*
        .domain(data.map(xAccessor))
        .range([0, dimensions.width - dimensions.margin.left - dimensions.margin.right])
        */

      // const timeParse = d3.timeParse('%M:%S.%L')

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data.data, yAccessor))
        .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])

      xAxisContainer.call(d3.axisBottom(xScale))
      yAxisContainer.call(d3.axisLeft(yScale).tickFormat(d3.timeFormat('%M:%S.%L')))

      // const points = data.data.map((d) => [xScale(d.lapNumber), yScale((d.lapTime)), d.driver])
      // const groups = d3.rollup(points, v => Object.assign(v, { z: v[0][2] }), d => d[2])
      // const groups = d3.group(data.data, d => d.driver)
      // console.log(points)
      // console.log(groups)
      const colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
        '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300',
        '#809900', '#E6B3B3', '#6680B3', '#66991A', '#FF99E6', '#CCFF1A',
        '#FF1A66', '#E6331A', '#33FFCC']

      //
      function dataJoin () {
        // const points = data.data.map((d) => [xScale(d.lapNumber), yScale((d.lapTime)), d.driver])
        // const groups = d3.rollup(points, v => Object.assign(v, { z: v[0][2] }), d => d[2])
        bounds.selectAll('path')
          .data(data) // if this is gorups.values() its instance of the graph doesn't get removed, fix
          .join(enterFn, updateFn, exitFn)
      }
      dataJoin()

      function enterFn (sel) {
        const points = data.data.map((d) => [xScale(d.lapNumber), yScale((d.delta)), d.driver])
        const groups = d3.rollup(points, v => Object.assign(v, { z: v[0][2] }), d => d[2])
        console.log(points)
        console.log([...groups.values()])
        console.log(groupedData.has(''))

        return sel.append('path')
          .data([...groups.values()])
          .join('path')
          .attr('fill', 'none')
          .attr('stroke', function (d) {
            const rnd = Math.floor(Math.random() * 20)
            return colors[rnd]
          })
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .style('mix-blend-mode', 'multiply')
          .attr('d', d3.line()
            .x(d => {
              if (typeof (d[0]) === 'undefined') {
                console.log('qewr')
              }
              return d[0]
            })
            .y(d => {
              if (typeof (d[1]) === 'undefined') {
                console.log(d[2])
              }
              return d[1]
            })

          )
      }

      function updateFn (sel) {
        return sel
          .call(update => update
            .transition()
            .duration(TR_TIME)
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
      updateData = function () {
        // xScale.domain(data.map(xAccessor))
        xScale.domain(d3.extent(data.lapsCount))
        // yScale.domain(d3.extent(data, yAccessor))
        yScale.domain(d3.extent(data.lapTimesMs))
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

  //
  linechart.deltas = function (_) {
    if (!arguments.length) return deltas
    deltas = _
    if (typeof updateData === 'function') updateData()
    return linechart
  }

  // stuff for constructor (?)
  linechart.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return linechart
  }
  linechart.xAccessor = function (_) {
    if (!arguments.length) return xAccessor
    xAttribute = _
    if (typeof updateXAccessor === 'function') updateXAttribute()
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
  return linechart
}
