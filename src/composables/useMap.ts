import { computed, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import { calculateDateAndTemp, getMonthColor } from '../utils/dateUtils'
import { useRouteStore } from '../stores/data'
import { storeToRefs } from 'pinia'

export default function useMap() {
  const routeStore = useRouteStore()
  const { initialRoute, tempRange } = storeToRefs(routeStore)
  const markers = ref<{ position: [number, number], color: string, popupContent: string[] }[]>([])
  const polylineCoords = computed(() => initialRoute.value.map(state => [state.lat, state.lon] as [number, number]))
  const originalPosition = ref<{ index: number, position: [number, number] } | null>(null)

  const fuzzyPolylines = computed(() => {
    return initialRoute.value.slice(0, -1).map((state, index) => {
      const { date } = calculateDateAndTemp(state, index, tempRange.value, initialRoute.value.length)
      return {
        coords: [[state.lat, state.lon], [initialRoute.value[index + 1].lat, initialRoute.value[index + 1].lon]] as [[number, number], [number, number]],
        color: getMonthColor(date)
      }
    })
  })

  const mapRef = ref<any>(null)

  const updateMarkers = () => {
    markers.value = initialRoute.value.map((state, index) => {
      const { date, temp, color } = calculateDateAndTemp(state, index, tempRange.value, initialRoute.value.length)
      return {
        position: [state.lat, state.lon] as [number, number],
        color: color,
        popupContent: [
          state.name,
          date.toDateString(),
          temp
        ]
      }
    })
    fitToBounds()
  }

  const onMarkerDragStart = (index: number) => {
    // Store the original position before dragging
    originalPosition.value = {
      index,
      position: [initialRoute.value[index].lat, initialRoute.value[index].lon] as [number, number]
    }
  }


  const onMarkerDragEnd = (event: any, draggedIndex: number) => {
    const latlng = event.target.getLatLng()

    const threshold = 1.5 // Distance for snapping
    let closestIndex = -1
    let minDistance = threshold

    markers.value.forEach((marker, index) => {
      if (index !== draggedIndex) { // Don't compare with itself
        const distance = Math.sqrt(
          Math.pow(marker.position[0] - latlng.lat, 2) +
          Math.pow(marker.position[1] - latlng.lng, 2)
        )

        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      }
    })

    if (closestIndex !== -1) {
      // Swap positions if snapping occurs
      const temp = initialRoute.value[draggedIndex]
      initialRoute.value[draggedIndex] = initialRoute.value[closestIndex]
      initialRoute.value[closestIndex] = temp

      routeStore.updateRoute([...initialRoute.value]) // Save new state
    } else {
      // No valid snap → Reset to original position
      if (originalPosition.value?.index === draggedIndex) {
        initialRoute.value[draggedIndex].lat = originalPosition.value.position[0]
        initialRoute.value[draggedIndex].lon = originalPosition.value.position[1]
      }
    }

    updateMarkers()
  }

  const fitToBounds = () => {
    if (!mapRef.value || markers.value.length === 0) return

    const leafletMap = mapRef.value.leafletObject // Get the Leaflet map instance
    if (!leafletMap) return

    const bounds = L.latLngBounds(markers.value.map(m => m.position))
    nextTick(() => {
      leafletMap.fitBounds(bounds, { padding: [50, 50] }) // Corrected reference
    })
  }

  watch([initialRoute, tempRange], () => {
    updateMarkers()
    routeStore.saveToLocalStorage(), { deep: true }
  })
  // watch(() => initialRoute.value, updateMarkers, { deep: true, immediate: true })

  return {
    markers,
    polylineCoords,
    fuzzyPolylines,
    updateMarkers,
    onMarkerDragStart,
    onMarkerDragEnd,
    fitToBounds,
    mapRef
  }
}