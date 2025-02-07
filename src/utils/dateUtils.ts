import type { State } from "../models/State"

// Constants for the travel period
const START_DATE = new Date(2025, 3, 1) // April 1, 2025
const END_DATE = new Date(2025, 11, 1)  // December 1, 2025
const TOTAL_DAYS = (END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)

/**
 * Calculates the estimated date, temperature, and color for a given state index.
 */
export const calculateDateAndTemp = (
  state: State,
  index: number,
  tempRange: [number, number],
  totalStops: number = 48 // Default to 48 states, but allow flexibility
) => {
  const intervalDays = Math.floor(TOTAL_DAYS / (totalStops - 1)) // Avoid fencepost errors
  const date = new Date(START_DATE)
  date.setDate(START_DATE.getDate() + index * intervalDays)

  const dayOfYear = getDayOfYear(date)
  const tempCelsius = state.temperatures[dayOfYear % 365] ?? 10
  const tempFahrenheit = celsiusToFahrenheit(tempCelsius)

  return {
    date,
    temp: `${tempFahrenheit.toFixed(1)}°F`,
    color: getTemperatureColor(tempFahrenheit, tempRange)
  }
}

/**
 * Returns a color based on the given date’s month.
 */
export const getMonthColor = (date: Date) => {
  const monthColors = [
    '#1E90FF', // January - DodgerBlue (cold)
    '#00BFFF', // February - DeepSkyBlue (cold)
    '#87CEFA', // March - LightSkyBlue (cool)
    '#FFD700', // April - Gold (warming up)
    '#FFA500', // May - Orange (warm)
    '#FF4500', // June - OrangeRed (hot)
    '#FF0000', // July - Red (hottest)
    '#FF6347', // August - Tomato (hot)
    '#FFD700', // September - Gold (warm)
    '#FFA07A', // October - LightSalmon (cooling down)
    '#20B2AA', // November - LightSeaGreen (cool)
    '#4682B4'  // December - SteelBlue (cold)
  ]
  return monthColors[date.getMonth()]
}

/**
 * Converts Celsius to Fahrenheit.
 */
export const celsiusToFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32

/**
 * Returns a temperature-based color.
 */
export const getTemperatureColor = (temp: number, tempRange: [number, number]) => {
  const [idealMin, idealMax] = tempRange

  if (temp >= idealMin && temp <= idealMax) return 'rgb(0, 200, 0)' // Green for ideal temperatures

  const minTemp = 0
  const maxTemp = 100
  const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp)

  return temp > idealMax
    ? `rgb(${Math.min(255, Math.floor(255 * (normalizedTemp - 0.5) * 2))}, 0, 0)` // Red for hot
    : `rgb(0, 0, ${Math.min(255, Math.floor(255 * (1 - normalizedTemp) * 2))})` // Blue for cold
}

/**
 * Returns the day of the year for a given date.
 */
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}