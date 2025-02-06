export const calculateDateAndTemp = (
  state: { temperatures: number[] },
  index: number,
  tempRange: [number, number]
) => {
  const startDate = new Date(2025, 3, 1) // April 1, 2025
  const endDate = new Date(2025, 11, 1)  // December 1, 2025
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

  const intervalDays = Math.floor(totalDays / (47)) // Assuming 48 states, adjust if needed
  const date = new Date(startDate)
  date.setDate(startDate.getDate() + index * intervalDays)

  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )

  const tempCelsius = state.temperatures[dayOfYear % 365] || 10
  const tempFahrenheit = celsiusToFahrenheit(tempCelsius)

  return {
    date: date,
    temp: `${tempFahrenheit.toFixed(1)}°F`,
    color: getTemperatureColor(tempFahrenheit, tempRange)
  }
}

export const getMonthColor = (date: Date) => {
  // Colors reflecting average temperatures on the Northern Hemisphere
  const monthColors = [
    '#1E90FF', // January - cold (DodgerBlue)
    '#00BFFF', // February - cold (DeepSkyBlue)
    '#87CEFA', // March - cool (LightSkyBlue)
    '#FFD700', // April - warming up (Gold)
    '#FFA500', // May - warm (Orange)
    '#FF4500', // June - hot (OrangeRed)
    '#FF0000', // July - hottest (Red)
    '#FF6347', // August - hot (Tomato)
    '#FFD700', // September - warm (Gold)
    '#FFA07A', // October - cooling down (LightSalmon)
    '#20B2AA', // November - cool (LightSeaGreen)
    '#4682B4'  // December - cold (SteelBlue)
  ]

  return monthColors[date.getMonth() % 12]
}

export const celsiusToFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32

export const getTemperatureColor = (temp: number, tempRange: [number, number]) => {
  const [idealMin, idealMax] = tempRange

  if (temp >= idealMin && temp <= idealMax) {
    return 'rgb(0, 200, 0)' // Green for ideal temperatures
  }

  const minTemp = 0
  const maxTemp = 100
  const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp)
  const red = temp > idealMax ? Math.min(255, Math.floor(255 * (normalizedTemp - 0.5) * 2)) : 0
  const blue = temp < idealMin ? Math.min(255, Math.floor(255 * (1 - normalizedTemp) * 2)) : 0

  return `rgb(${red}, 0, ${blue})`
}
