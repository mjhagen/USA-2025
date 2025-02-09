<template>
  <l-map ref="mapRef" v-model:zoom="zoom" :center="center" @ready="fitToBounds">
    <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" name="OpenStreetMap" />

    <l-polyline v-if="markers.length > 1" :lat-lngs="polylineCoords" color="blue" />

    <l-polyline v-for="(segment, i) in fuzzyPolylines" :key="i" :lat-lngs="segment.coords" :color="segment.color"
      :weight="20" :opacity="0.3" />

    <l-marker v-for="(marker, index) in markers" :key="index" :lat-lng="marker.position" :draggable="true"
      @drastart="onMarkerDragStart(index)"
      @dragend="onMarkerDragEnd($event, index)">
      <l-icon :icon-anchor="[17, 17]">
        <div class="w-8 h-8 rounded-full border-2 p-1 text-center bg-blend-hue text-white font-bold" :style="{'background-color': marker.color}">{{ index }}</div>
      </l-icon>
      <l-popup>
        <div v-for="line in marker.popupContent" :key="line">{{ line }}</div>
      </l-popup>
    </l-marker>
  </l-map>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LMap, LTileLayer, LMarker, LPolyline, LPopup, LIcon } from '@vue-leaflet/vue-leaflet'
import useMap from '../composables/useMap'
import "leaflet/dist/leaflet.css"

const zoom = ref(4)
const center = ref<[number, number]>([39.8283, -98.5795])

const {
  markers,
  polylineCoords,
  fuzzyPolylines,
  onMarkerDragStart,
  onMarkerDragEnd,
  fitToBounds,
  mapRef
} = useMap()
</script>

<style>
.leaflet-div-icon {
  background: transparent !important;
  border: 0 !important;
}
</style>