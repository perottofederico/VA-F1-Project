import * as d3 from 'd3'

export const TR_TIME = 750

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
    delta: 0
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

export function isSecondDriver (abbreviation) {
  const secondDrivers = ['ZHO', 'TSU', 'OCO', 'STR', 'SAI', 'MAG',
    'PIA', 'RUS', 'PER', 'SAR']
  if (secondDrivers.includes(abbreviation)) return true
  else return false
}

export function trackStatusToColor (trackStatus) {
  switch (trackStatus % 10) {
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
}
export function trackStatusToString (trackStatus) {
  switch (trackStatus % 10) {
    case 2: return 'Yellow Flag' // yellow for yellow flag
    case 4: return 'Safety Car' // orange for safety car
    case 5: return 'Red Flag' // red for red flag
    case 6: return 'VSC' // white for VSC
    case 7: return 'VSC' // white for VSC (ending)
    // This cases aren't considered, but could be done using a gradient
    case 24: return d3.schemeSet1[4]
    case 25: return d3.schemeSet1[0]
    case 45: return d3.schemeSet1[0]
    case 67: return 'white'
  }
}

export function compoundToColor (compound) {
  switch (compound) {
    case 'SOFT': return 'red'
    case 'MEDIUM': return 'yellow'
    case 'HARD': return 'white'
    case 'INTERMEDIATE': return 'green'
    case 'WET': return 'blue'
  }
}
