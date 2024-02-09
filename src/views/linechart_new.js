import * as d3 from 'd3'

const TR_TIME = 500

export default function () {
  let data = []
  let xAccessor = d => d.lapsCount
  let yAttribute = 'deltas'
  const yAccessor = d => d[yAttribute]
  let updateData
  let updateXAccessor
  let updateYAttribute
  let updateWidth
  let updateHeight
  const dimensions = {
    width: 1800,
    height: 500,
    margin: {
      top: 50,
      right: 20,
      bottom: 30,
      left: 30
    }
  }

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
      //
      // CHANGE THIS
      const xScale = d3.scaleLinear()
        .domain(data.LapNumber)
        .range([0, dimensions.width - dimensions.margin.left - dimensions.margin.right])
      // .padding(0.1)
      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, yAccessor))
        .range([dimensions.height - dimensions.margin.top - dimensions.margin.bottom, 0])

      xAxisContainer.call(d3.axisBottom(xScale))
      yAxisContainer.call(d3.axisLeft(yScale))

      //
      function dataJoin () {
        bounds.selectAll('path')
          .data(data)
          .join(enterFn, updateFn, exitFn)
      }
      dataJoin()

      function enterFn (sel) {
        return sel.append('path')
          .attr('x', d => xScale(xAccessor(d)))
        // .attr('width', xScale.bandwidth())
          .attr('y', d => yScale(yAccessor(d)))
          .attr('height', d => yScale.range()[0] - yScale(yAccessor(d)))
          .style('fill', d => d.selected ? '#c1121f' : '#003049')
          .on('mouseenter', (_e, d) => onBarEnter(d))
          .on('mouseleave', (_e, d) => onBarLeave(d))
      }

      function updateFn (sel) {
        // sel.style('fill', d => d.selected ? SEL_FILL : BAR_FILL)
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
      }

      function exitFn (sel) {
        sel.call(exit => exit
          .transition()
          .duration(TR_TIME)
          .remove()
        )
      }

      //
      updateData = function () {
        xScale.domain(data.map(xAccessor))
        yScale.domain(d3.extent(data, yAccessor))
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
        xScale.domain(data.map(xAccessor))
        xAxisContainer.call(d3.axisBottom(xScale))
        dataJoin()
      }

      updateYAttribute = function () {
        yScale.domain(d3.extent(data, yAccessor))
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
          .call(d3.axisLeft(yScale))
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
