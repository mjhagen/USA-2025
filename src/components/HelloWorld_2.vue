<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@vueform/slider/themes/default.css'
import Slider from '@vueform/slider'

import stateData from '@/assets/state_capitals.json'

interface State {
  name: string
  lat: number
  lon: number
  temperatures: number[]
}

const initialRoute = ref<State[]>([])
const presetCoordinates = ref<{ lat: number; lon: number }[]>([])

const map = ref<L.Map>(null as any)
const markers = ref<L.Marker[]>([])
let polyline: L.Polyline | null = null
let fuzzyLayers: L.Polyline[] = []

const startDate = new Date(2025, 3, 1)
const endDate = new Date(2025, 11, 1)

const tempRange = ref([65, 75])

const monthColors = [
  '#39FF14',
  '#00FFFF',
  '#FF007F',
  '#DFFF00',
  '#0FF0FC',
  '#FF5F1F',
  '#B026FF',
  '#FFFF54',
  '#FF00FF',
  '#B0FF00',
  '#FF073A',
  '#30D5C8',
]

const calculateDates = () => {
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
  const interval = totalDays / (initialRoute.value.length - 1)

  return initialRoute.value.map((state, index) => {
    const date = new Date(startDate.getTime() + index * interval * 24 * 3600 * 1000)
    return date
  })
}

const getMonthColor = (date: Date) => monthColors[date.getMonth() % 12]

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

const celsiusToFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32

const getTemperatureColor = (temp: number) => {
  const minTemp = 0
  const maxTemp = 100
  const idealMin = tempRange.value[0]
  const idealMax = tempRange.value[1]

  if (temp >= idealMin && temp <= idealMax) {
    return 'rgb(0, 200, 0)' // Green for ideal temperatures
  }

  const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp)
  const red = temp > idealMax ? Math.min(255, Math.floor(255 * (normalizedTemp - 0.5) * 2)) : 0
  const blue = temp < idealMin ? Math.min(255, Math.floor(255 * (1 - normalizedTemp) * 2)) : 0

  return `rgb(${red}, 0, ${blue})`
}

const calculateDateAndTemp = (state: State, date: Date) => {
  const dayOfYear = getDayOfYear(date)
  const tempCelsius = state.temperatures[dayOfYear % 365] || 10
  const tempFahrenheit = celsiusToFahrenheit(tempCelsius)
  return { date: date, temp: `${tempFahrenheit.toFixed(1)}°F`, color: getTemperatureColor(tempFahrenheit) }
}

const saveToLocalStorage = () => {
  localStorage.setItem('routeData', JSON.stringify(initialRoute.value))
  localStorage.setItem('tempRange', JSON.stringify(tempRange.value))
}

const loadFromLocalStorage = () => {
  const savedRoute = localStorage.getItem('routeData')
  const savedTempRange = localStorage.getItem('tempRange')

  if (savedRoute) {
    initialRoute.value = JSON.parse(savedRoute)
  } else {
    initialRoute.value = Object.keys(stateData).map((key) => ({
      name: key,
      lat: stateData[key].coordinates[0],
      lon: stateData[key].coordinates[1],
      temperatures: stateData[key].temperatures
    }))
  }

  if (savedTempRange) {
    tempRange.value = JSON.parse(savedTempRange)
  }
}

const initializeMap = () => {
  loadFromLocalStorage()

  presetCoordinates.value = initialRoute.value.map(state => ({ lat: state.lat, lon: state.lon }))

  if (map.value) return

  map.value = L.map('map').setView([39.8283, -98.5795], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  updateMarkers()
}

const updateMarkers = () => {
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  fuzzyLayers.forEach(layer => layer.remove())
  fuzzyLayers = []

  if (polyline) {
    polyline.remove()
  }

  const dates = calculateDates()

  initialRoute.value.forEach((state, index) => {
    const { date, temp, color } = calculateDateAndTemp(state, dates[index])

    const fuzzyLayer = L.polyline([
      [state.lat, state.lon],
      [initialRoute.value[(index + 1) % initialRoute.value.length].lat,
      initialRoute.value[(index + 1) % initialRoute.value.length].lon]
    ], {
      color: getMonthColor(date),
      weight: 20,
      opacity: 0.3,
      className: 'fuzzy-line'
    }).addTo(map.value!)

    fuzzyLayers.push(fuzzyLayer)

    const marker = L.marker([state.lat, state.lon], {
      draggable: true,
      icon: L.divIcon({
        className: 'custom-icon',
        html: `<div style="background: ${color}; color: white; border-radius: 50%; padding: 4px 8px; text-align: center;">${index + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    })
      .addTo(map.value!)
      .bindPopup(`${state.name}<br>${date.toDateString()}<br>${temp}`)

    markers.value.push(marker)
  })

  const latlngs = initialRoute.value.map(state => [state.lat, state.lon])
  polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map.value!)
}

watch([initialRoute, tempRange], async () => {
  await nextTick()
  updateMarkers()
  saveToLocalStorage()
}, { deep: true })

onMounted(() => {
  initializeMap()
})
</script>

<template>
  <div class="p-4 w-full">
    <div class="flex items-end justify-between mb-4 sticky">
      <h1 class="text-2xl font-bold">Interactive Route Mapper</h1>
      <Slider v-model="tempRange" :min="0" :max="100" :step="1" range class="w-96 z-10" @input="updateMarkers"></Slider>
    </div>

    <div class="flex w-full h-screen">
      <div class="w-1/3 overflow-y-auto p-2 bg-gray-100">
        <ul class="list-none">
          <li v-for="(state, index) in initialRoute" :key="state.name" class="mb-2 p-2 bg-white rounded shadow">
            <strong>{{ index + 1 }}. {{ state.name }}</strong>
            <div>{{ calculateDateAndTemp(state, calculateDates()[index]).date }}</div>
            <div>{{ calculateDateAndTemp(state, calculateDates()[index]).temp }}</div>
          </li>
        </ul>
      </div>

      <div id="map" class="w-2/3 h-full"></div>
    </div>
  </div>
</template>

<style>
#map {
  width: 100%;
  height: 100%;
}

.custom-icon {
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 4px;
}

.fuzzy-line {
  filter: blur(8px);
  transition: opacity 0.3s ease-in-out;
}
</style>