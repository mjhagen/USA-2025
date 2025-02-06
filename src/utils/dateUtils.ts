export const calculateDateAndTemp = (state: { temperatures: number[] }, index: number, tempRange: [number, number]) => {
  const startDate = new Date(2025, 3, 1)
  const intervalDays = Math.floor((244 - 91) / (state.temperatures.length - 1))
  const date = new Date(startDate)
  date.setDate(startDate.getDate() + index * intervalDays)

  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  const tempCelsius = state.temperatures[dayOfYear % 365] || 10
  const tempFahrenheit = celsiusToFahrenheit(tempCelsius)

  return {
    date: date,
    temp: `${tempFahrenheit.toFixed(1)}°F`,
    color: getTemperatureColor(tempFahrenheit, tempRange)
  }
}

export const getMonthColor = (date: Date) => {
  const monthColors = [
    '#39FF14', '#00FFFF', '#FF007F', '#DFFF00', '#0FF0FC',
    '#FF5F1F', '#B026FF', '#FFFF54', '#FF00FF', '#B0FF00',
    '#FF073A', '#30D5C8'
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
