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

const map = ref<L.Map | null>(null)
let markers: L.Marker[] = []
let polyline: L.Polyline | null = null
let fuzzyLayers: L.Polyline[] = []
let currentMarkerIndex: number | null = null
let highlightedMarker: L.Marker | null = null // Track the highlighted marker
let isZooming = false

const initializeMap = () => {
  map.value = L.map('map', {
    zoomAnimation: false,    // Disable zoom animations
    fadeAnimation: false     // Disable fade animations for extra stability
  })
    .setView([39.8283, -98.5795], 4)
    .flyTo([39.8283, -98.5795], 5, {
      animate: true,
      duration: 0.3
    })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value as L.Map)

  map.value.on('zoomstart', () => isZooming = true)

  map.value.scrollWheelZoom.enable()
  map.value.options.zoomSnap = 0.25   // Allows finer zoom steps
  map.value.options.zoomDelta = 0.5   // Adjusts the smoothness of zoom steps

  map.value.on('zoomend', () => {
    isZooming = false
    updateMarkers() // Update markers after zoom ends
  })

  updateMarkers()
}

const swapMarkers = (indexA: number, indexB: number) => {
  const temp = props.route[indexA]
  props.route[indexA] = props.route[indexB]
  props.route[indexB] = temp
  updateMarkers()
}

const updateMarkers = () => {
  if (isZooming || !map.value) return // Skip updates during zoom

  markers.forEach(marker => {
    if (map.value?.hasLayer(marker)) {
      map.value.removeLayer(marker)
    }
  })

  // markers.forEach(marker => marker.remove())
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
      }).addTo(map.value as L.Map)

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
      .addTo(map.value as L.Map)
      .bindPopup(`${state.name}<br>${date.toDateString()}<br>${temp}`)

    marker.on('dragstart', () => {
      currentMarkerIndex = index
    })

    marker.on('drag', (event) => {
      const { lat, lng } = event.target.getLatLng()

      // Find the closest marker within a small threshold
      const threshold = 1.5
      let closestMarker: L.Marker | null = null
      let minDistance = threshold

      markers.forEach((m) => {
        if (m !== marker) {
          const distance = Math.sqrt(
            Math.pow(m.getLatLng().lat - lat, 2) + Math.pow(m.getLatLng().lng - lng, 2)
          )

          if (distance < minDistance) {
            minDistance = distance
            closestMarker = m
          }
        }
      })

      // Highlight the marker if close enough
      if (closestMarker && closestMarker !== highlightedMarker) {
        if (highlightedMarker) {
          resetMarkerStyle(highlightedMarker) // Remove previous highlight
        }
        highlightMarker(closestMarker)
        highlightedMarker = closestMarker
      } else if (!closestMarker && highlightedMarker) {
        resetMarkerStyle(highlightedMarker) // Clear highlight if no marker is close
        highlightedMarker = null
      }
    })

    marker.on('dragend', (event) => {
      const { lat, lng } = event.target.getLatLng()

      // Find the closest marker within a small threshold
      const threshold = 1.5 // Adjust as needed
      let snappedIndex = -1

      markers.forEach((m, idx) => {
        if (m !== marker) { // Avoid comparing with itself
          const distance = Math.sqrt(
            Math.pow(m.getLatLng().lat - lat, 2) + Math.pow(m.getLatLng().lng - lng, 2)
          )

          if (distance < threshold) {
            snappedIndex = idx
          }
        }
      })

      // Perform swap if valid
      if (currentMarkerIndex !== null && snappedIndex !== -1 && currentMarkerIndex !== snappedIndex) {
        swapMarkers(currentMarkerIndex, snappedIndex)
        currentMarkerIndex = null
      }

      updateMarkers()
    })

    markers.push(marker)
  })

  const latlngs: L.LatLngTuple[] = props.route.map(state => [state.lat, state.lon] as L.LatLngTuple)
  polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map.value as L.Map)
}

const highlightMarker = (marker: L.Marker) => {
  marker.setIcon(
    L.divIcon({
      className: 'highlighted-icon',
      html: `<div style="background: yellow; color: black; border: 2px solid red; border-radius: 50%; padding: 4px 8px; text-align: center;">*</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  )
}

const resetMarkerStyle = (marker: L.Marker) => {
  const index = markers.indexOf(marker)
  marker.setIcon(
    L.divIcon({
      className: 'custom-icon',
      html: `<div style="background: blue; color: white; border-radius: 50%; padding: 4px 8px; text-align: center;">${index + 1}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  )
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
