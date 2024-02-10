import * as d3 from 'd3'

const TR_TIME = 250

export default function () {
  let data = []
  let deltas = []
  let xAccessor = d => d.lapsCount
  let yAttribute = 'lapTimesMs'
  const yAccessor = d => d.lapTimesMs
  let updateData
  let updateXAccessor
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
        .domain(d3.extent(data.lapsCount))
        .range([0, dimensions.width - dimensions.margin.right - dimensions.margin.left])
      /*
        .domain(data.map(xAccessor))
        .range([0, dimensions.width - dimensions.margin.left - dimensions.margin.right])
        */

      // const timeParse = d3.timeParse('%M:%S.%L')
      const yScale = d3.scaleLinear()
        .domain(d3.extent(data.lapTimesMs))
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

      /*
        bounds.append('g')
        .attr('fill', 'none')
        .attr('stroke', function (d) { return colors[Math.floor(Math.random() * 20)] })
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('path')
        .data(groups.values())
        .join('path')
        .style('mix-blend-mode', 'multiply')
        .attr('d', d3.line())
*/
      //
      function dataJoin () {
        console.log('dataJoin')
        const points = data.data.map((d) => [xScale(d.lapNumber), yScale((d.lapTime)), d.driver])
        const groups = d3.rollup(points, v => Object.assign(v, { z: v[0][2] }), d => d[2])
        bounds.selectAll('path')
          .data(data)
          .join(enterFn, updateFn, exitFn)
      }
      dataJoin()

      console.log(data)

      function enterFn (sel) {
        console.log('- enterFn')
        const points = data.data.map((d) => [xScale(d.lapNumber), yScale((d.lapTime)), d.driver])
        const groups = d3.rollup(points, v => Object.assign(v, { z: v[0][2] }), d => d[2])
        return sel.append('path')
          .data(groups.values())
          .join('path')
          .attr('fill', 'none')
          .attr('stroke', function (d) {
            const rnd = Math.floor(Math.random() * 20)
            return colors[rnd]
          })
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          // .style('mix-blend-mode', 'multiply')
          .attr('d', d3.line())
      }

      function updateFn (sel) {
        console.log('updateFn')
        return sel
          .call(update => update
            .transition()
            .duration(TR_TIME)
          )
      }

      function exitFn (sel) {
        console.log('exitFn')
        sel.call(exit => exit
          // .transition()
          // .duration(TR_TIME)
          .remove()
        )
      }

      function enterFnRef (sel) {
        const groups = d3.group(data.data, d => d.driver)
        console.log(groups.values())
        const line = d3.line()
          .x(function (d) { return xScale(d.lapNumber) })
          .y(function (d) { return yScale(d.lapTime) })
        console.log(sel)
        return sel.append('path')
          .attr('class', 'linechart_path')
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', '1.5')
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('class', 'line')
          .data(groups)
          .style('mix-blend-mode', 'multiply')
          .attr('d', line)

        const path = bounds.append('path')
          .attr('class', 'linechart_path')

        /*
          .attr('d', function (d) {
            return d3.line()
              .x(function (d) { return x(d.lapNumber) })
              .y(function (d) { y(d.lapTime) })
          })

          .attr('x', d => xScale(xAccessor(d)))
          // .attr('width', xScale.bandwidth())
          .attr('y', d => yScale(yAccessor(d)))
          .attr('height', d => yScale.range()[0] - yScale(yAccessor(d)))
          .style('fill', d => d.selected ? '#c1121f' : '#003049')
          .on('mouseenter', (_e, d) => onBarEnter(d))
          .on('mouseleave', (_e, d) => onBarLeave(d))
          */
      }

      function updateFnRef (sel) {
        // sel.style('fill', d => d.selected ? SEL_FILL : BAR_FILL)
        console.log('updateFn called')
        /*
        return sel
          .call(update => update
            .transition()
            .duration(TR_TIME)
            .attr('x', d => xScale(xAccessor(d)))
            // .attr('width', xScale.bandwidth())
            .attr('y', d => yScale(yAccessor(d)))
            .attr('height', d => yScale.range()[0] - yScale(yAccessor(d)))
          // .style('fill', d => d.selected ? SEL_FILL : BAR_FILL)
          )
          */
      }

      function exitFnRef (sel) {
        sel.call(exit => exit
          .transition()
          .duration(TR_TIME)
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

      updateXAccessor = function () {
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
    xAccessor = _
    if (typeof updateXAccessor === 'function') updateXAccessor()
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
