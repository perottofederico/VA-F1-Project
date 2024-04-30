import * as d3 from 'd3'
import { handleSelection } from '@/utils'

// Drivers Legend
export function onEnter (e, d) {
  d3.selectAll('#' + d.Abbreviation).style('opacity', 1)
}
export function onClick (e, d) {
  const driverClicked = d3.select('.drivers_legend').select('#' + d.Abbreviation)
  console.log(d.Abbreviation)
  if (driverClicked.attr('selected') === 'true') {
    driverClicked.attr('selected', 'false')
  } else {
    driverClicked.attr('selected', 'true')
  }
  handleSelection()
}

export function onLeave (e, d) {
  handleSelection()
}
