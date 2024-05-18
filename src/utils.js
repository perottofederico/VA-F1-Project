import * as d3 from 'd3'
import { onClick } from './views/eventHandlers'
export const TR_TIME = 350
export const EPSILON = 0.000001

export function sentenceString (s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function formatLap (entry) {
  return {
    driver: entry.Driver,
    driverNumber: entry.DriverNumber,
    lapNumber: entry.LapNumber,
    lapTime: entry.LapTime,
    stint: entry.Stint,
    pitOutTime: entry.PitOutTime,
    pitInTime: entry.PitInTime,
    compound: entry.Compound,
    isPersonalBest: entry.IsPersonalBest,
    team: entry.Team,
    lapStartTime: entry.LapStartTime,
    lapStartDate: entry.LapStartDate,
    trackStatus: entry.TrackStatus,
    position: entry.Position,
    delta: 0,
    lapId: entry.Driver + entry.LapNumber
  }
}

export function formatPitStop (entry) {
  return {
    lastName: entry.Driver,
    team: entry.Team,
    time: parseFloat(entry['Time (sec)']),
    lapNumber: entry.Lap
  }
}

// Probably there's a better way to do this, but why complicate things
// https://stackoverflow.com/questions/42963770/how-to-use-d3-js-colorscale-to-change-color-based-on-string-values-rather-than-n
export function getTeamColor (teamName) {
  const colors = d3.schemeCategory10
  switch (teamName) {
    case 'Red Bull Racing':
    case 'Red Bull':
      return colors[0]
    case 'McLaren': return colors[1]
    case 'Aston Martin': return colors[2]
    case 'Ferrari': return colors[3]
    case 'Mercedes': return colors[4]
    case 'Alfa Romeo': return colors[5]
    case 'Alpine': return colors[6]
    case 'Haas F1 Team':
    case 'Haas':
      return colors[7]
    case 'AlphaTauri': return colors[8]
    case 'Williams': return colors[9]
  }
}

export function getRacesList () {
  // Wanted to get the list directly from acessing the directory but don't want to add a dependency, this is easy
  const list = ['1_Sakhir', '2_Jeddah', '3_Melbourne', '4_Baku', '5_Miami', '6_Monaco', '7_Barcelona', '8_Montréal', '9_Spielberg', '10_Silverstone', '11_Budapest',
    '12_Spa-Francorchamps', '13_Zandvoort', '14_Monza', '15_Marina Bay', '16_Suzuka', '17_Lusail', '18_Austin', '19_Mexico City', '20_São Paulo', '21_Las Vegas', '22_Yas Island']
  return list
}

// Hacky function to differentiate between first and second drivers of a team
export function isSecondDriver (abbreviation) {
  const secondDrivers = ['ZHO', 'TSU', 'OCO', 'STR', 'SAI', 'MAG',
    'PIA', 'RUS', 'PER', 'SAR']
  if (secondDrivers.includes(abbreviation)) return true
  else return false
}

// Convert an int representing the track status into a color hex
export function trackStatusToColor (trackStatus) {
  switch (trackStatus % 10) {
    case 2: return d3.schemeSet3[11] // yellow for yellow flag
    case 4: return d3.schemeSet3[5] // orange for safety car
    case 5: return d3.schemeSet3[3] // red for red flag
    case 6: return d3.schemeSet3[1] // white for VSC
    case 7: return d3.schemeSet3[1] // white for VSC (ending)
  }
}

// Convert an int representing the track status into a String
export function trackStatusToString (trackStatus) {
  switch (trackStatus % 10) {
    case 2: return 'Yellow Flag' // yellow for yellow flag
    case 4: return 'Safety Car' // orange for safety car
    case 5: return 'Red Flag' // red for red flag
    case 6: return 'VSC' // white for VSC
    case 7: return 'VSC' // white for VSC (ending)
  }
}

// convert a 'compound' string into a color hex
export function compoundToColor (compound) {
  switch (compound) {
    case 'SOFT': return '#dd0741'
    case 'MEDIUM': return '#F8D500'
    case 'HARD': return '#eee'
    case 'INTERMEDIATE': return '#44D745'
    case 'WET': return '#005AFF'
  }
}

//
export function getContextualData (axis, driver) {
  switch (axis) {
    case 'AvgLaptime': return 'Avg Laptime ' + d3.timeFormat('%M:%S.%L')(driver[axis])
    case 'LaptimeConsistency': return 'Consistency: ' + driver[axis].toFixed(2) + '%'
    case 'PitStopTime': return 'Total Pitstop Time: ' + driver[axis] + ' s'
    case 'AvgSpeed': return 'Average Speed: ' + driver[axis] + ' km/h'
    case 'PositionsGained': return 'Started ' + driver.startingPos +
    '<br>Finished ' + driver.finishingPos +
    '<br>Positions Gained: ' + driver.PositionsGained
  }
}

// Function to handle multiple selections
export function handleSelection () {
  // A list of all the drivers
  const allDrivers = [...d3.select('.drivers_legend').select('g').selectAll('g')].map(driver => driver.id)
  const totalDrivers = allDrivers.length

  // drivers_legend
  const dlBounds = d3.select('.drivers_legend')
  const dlSelection = [...dlBounds.selectAll('g[selected = true]')]
    .map(driver => driver.id)
  // parallel_coordinates
  const pcBounds = d3.select('.parallel_coordinates_container').select('.contents')
  const pcSelection = [...pcBounds.selectAll('path[selected = true]')]
    .map(driver => driver.id)
  // stacked_barchart
  const sbBounds = d3.select('.stackedBarchart_container').select('.contents')
  const sbData = sbBounds.selectAll('rect[selected = true]')
  const sbSelection = [...sbBounds.selectAll('rect[selected = true]')]
    .map(driver => driver.id)

  // Basically an AND of the two lists
  const selected = pcSelection.filter(d => dlSelection.includes(d))
  // console.log(dlSelection, pcSelection, selected)

  // This case handles the default values of the 'selected' attribute
  // It's probably redundant
  if (dlSelection.length === totalDrivers && pcSelection.length === totalDrivers) {
    // console.log('full selection')
    allDrivers.forEach(driver => {
      d3.select('.drivers_legend').selectAll('#' + driver).style('opacity', 1)
        .style('pointer-events', 'bounding-box')
      d3.select('.drivers_legend').selectAll('g#' + driver).on('click', onClick)
      d3.selectAll('.contents').selectAll('#' + driver).style('opacity', 1)
        .style('pointer-events', 'all')
    })
  } else
  // Case in which the interaction has happened only in the parallel coordinates
  if (dlSelection.length === totalDrivers && !(pcSelection.length === totalDrivers)) {
    // console.log('pcSelection')
    // Set the opacity, interactions and status of elements outside the selection
    allDrivers.filter(driver => !pcSelection.includes(driver)).forEach(elem => {
      d3.select('.drivers_legend').selectAll('#' + elem)
        .style('opacity', 0.5)
        .style('pointer-events', 'bounding-box')
      d3.select('.drivers_legend').selectAll('g#' + elem).on('click', null)
      d3.selectAll('.contents').selectAll('#' + elem).style('opacity', 0)
        .style('pointer-events', 'none')

      // Set the opacity, interactions and status of elements inside the selection
      pcSelection.forEach(elem => {
        d3.select('.drivers_legend').selectAll('#' + elem)
          .attr('selected', 'true')
          .style('opacity', 1)
          .style('pointer-events', 'bounding-box')
        d3.select('.drivers_legend').selectAll('g#' + elem).on('click', onClick)
        d3.selectAll('.contents').selectAll('#' + elem).style('opacity', 1)
          .style('pointer-events', 'all')
      })
    })
  } else
  // Case in which the interaction has happened only in the drivers_legend
  if (!(dlSelection.length === totalDrivers) && pcSelection.length === totalDrivers) {
    // console.log('dlSelection')
    // Set the opacity, interactions and status of elements outside the selection
    allDrivers.filter(driver => !dlSelection.includes(driver)).forEach(elem => {
      d3.select('.drivers_legend').selectAll('#' + elem).style('opacity', 0.5)
        .style('pointer-events', 'bounding-box')
      d3.selectAll('.contents').selectAll('#' + elem).style('opacity', 0)
        .style('pointer-events', 'none')
    })

    // For the drivers that are part of the selection, set their opacity to 1
    // and allow interactions
    dlSelection.forEach(driver => {
      d3.select('.drivers_legend').selectAll('#' + driver).style('opacity', 1)
        .style('pointer-events', 'bounding-box')
      d3.select('.drivers_legend').selectAll('g#' + driver)
      d3.selectAll('.contents').selectAll('#' + driver).style('opacity', 1)
        .style('pointer-events', 'all')
    })
  } else {
    // Case in which the interaction has happened in both the drivers_legend and the parallel coordinates

    // For all the drivers that aren't part of both selection, decrease their opacity
    // and remove/limit the interactions
    // console.log('mixed selection')
    allDrivers.filter(driver => !selected.includes(driver)).forEach(elem => {
      d3.select('.drivers_legend').selectAll('#' + elem).style('opacity', 0.5)
        .style('pointer-events', 'bounding-box')

      d3.selectAll('.contents').selectAll('#' + elem).style('opacity', 0)
        .style('pointer-events', 'none')
    })

    // For all the drivers that are part of both selections, set the opacity to 1
    // and allow interactions
    selected.forEach(elem => {
      d3.select('.drivers_legend').selectAll('#' + elem).style('opacity', 1)
        .style('pointer-events', 'bounding-box')
      d3.selectAll('.contents').selectAll('#' + elem).style('opacity', 1)
        .style('pointer-events', 'all')
    })
  }

  // Handle Selection of bars/stints in barchart
  // for each of the drivers in sbSelection, select all of the other bars of the same driver and reduce their opacity
  sbSelection.forEach(driver => {
    d3.select('.stackedBarchart_container').select('.contents')
      .selectAll('rect#' + driver + '[selected = false]')
      .style('opacity', 0.5)
      // .style('pointer-events', 'all')
  })
  // for each of the drivers not in sbSelection, select all of the bars and set their opacity to 1
  allDrivers.filter(driver => !sbSelection.includes(driver)).forEach(driver => {
    d3.select('.stackedBarchart_container').select('.contents')
      .selectAll('rect#' + driver)
      .style('opacity', 1)
      // .style('pointer-events', 'all')
  })

  // Given how I implemented the linechart, I can't rely on the updated data to re-draw the circles/squares
  // so I have to manually set the opacity of the elements that are not part of the selection
  sbData.each(stint => {
    const secondDriver = isSecondDriver(stint.driver)
    if (secondDriver) {
      d3.select('.linechart_container').select('.linechart').select('.contents')
        .selectAll(`rect#${stint.driver}`).filter(d => {
          return d.lapNumber <= stint.lap || d.lapNumber > stint.lap + stint.length
        })
        .style('opacity', 0)
    } else {
      d3.select('.linechart_container').select('.linechart').select('.contents')
        .selectAll(`circle#${stint.driver}`).filter(d => {
          return d.lapNumber <= stint.lap || d.lapNumber > stint.lap + stint.length
        })
        .style('opacity', 0)
    }
  })
}

// function to reset the values for the 'selected' attribute
export function resetAllFilters () {
  d3.select('.drivers_legend').select('g').selectAll('g')
    .attr('selected', 'true')
    .style('pointer-events', 'bounding-box')
  // if there are zoom buttons, use them to reset the zoom
  d3.selectAll('.resetZoomButton').dispatch('click')

  d3.select('.parallel_coordinates_container').selectAll('path')
    .attr('selected', 'true')

  // to reset the selection in the stacked barchart, i dispatch a click event
  // so that the graph is redrawn with the full data
  d3.select('.stackedBarchart_container').select('.contents').selectAll('rect[selected = true]')
    .dispatch('click')

  handleSelection()
}
