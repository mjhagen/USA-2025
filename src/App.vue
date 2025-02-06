<template>
  <div class="p-4 w-full">
    <div class="flex items-end justify-between mb-4 sticky">
      <h1 class="text-2xl font-bold">Interactive Route Mapper</h1>
      <TemperatureSlider v-model="routeStore.tempRange" />
      <button @click="() => routeStore.sortRouteTSP()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Sort via TSP
      </button>
    </div>

    <div class="flex w-full h-screen">
      <StateList :route="routeStore.initialRoute" :tempRange="routeStore.tempRange" />
      <MapView :route="routeStore.initialRoute" :tempRange="routeStore.tempRange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouteStore } from './stores/data'
import MapView from './components/MapView.vue'
import StateList from './components/StateList.vue'
import TemperatureSlider from './components/TemperatureSlider.vue'

const routeStore = useRouteStore()

onMounted(() => {
  routeStore.loadFromLocalStorage()
})
</script>

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