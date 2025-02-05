<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { calculateDateAndTemp, getMonthColor } from '../utils/dateUtils'

interface Props {
  route: Array<{ name: string; lat: number; lon: number; temperatures: number[] }>
  tempRange: [number, number]
}

const props = defineProps<Props>()

const map = ref<L.Map>()
let markers: L.Marker[] = []
let polyline: L.Polyline | null = null
let fuzzyLayers: L.Polyline[] = []

const initializeMap = () => {
  map.value = L.map('map').setView([39.8283, -98.5795], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  updateMarkers()
}

const updateMarkers = () => {
  markers.forEach(marker => marker.remove())
  markers = []
  fuzzyLayers.forEach(layer => layer.remove())
  fuzzyLayers = []

  if (polyline) {
    polyline.remove()
  }

  props.route.forEach((state, index) => {
    const { date, temp, color } = calculateDateAndTemp(state, index, props.tempRange)

    if (index < props.route.length - 1) {
      const fuzzyLayer = L.polyline([
        [state.lat, state.lon],
        [props.route[index + 1].lat, props.route[index + 1].lon]
      ], {
        color: getMonthColor(date),
        weight: 20,
        opacity: 0.3,
        className: 'fuzzy-line'
      }).addTo(map.value!)

      fuzzyLayers.push(fuzzyLayer)
    }

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

    markers.push(marker)
  })

  const latlngs: L.LatLngTuple[] = props.route.map(state => [state.lat, state.lon] as L.LatLngTuple)
  polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map.value!)
}

watch(() => [props.route, props.tempRange], async () => {
  await nextTick()
  updateMarkers()
}, { deep: true })

onMounted(() => {
  initializeMap()
})
</script>

<template>
  <div id="map" class="w-2/3 h-full"></div>
</template>
