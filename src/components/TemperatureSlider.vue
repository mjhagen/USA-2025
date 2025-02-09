<template>
  <Slider 
    v-model="tempRange"
    @slide="onSliderUpdate" 
    :min="TEMP_MIN" 
    :max="TEMP_MAX" 
    :step="1" 
    range 
    class="w-96 z-10"
  />
</template>

<script setup lang="ts">
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import { TEMP_MAX, TEMP_MIN } from '../utils/dateUtils'

const tempRange = defineModel<[number, number]>()

const onSliderUpdate = (value: [number, number]) => tempRange.value = value
</script>

<style scoped>
.slider {
  margin: 0 1rem;
}
</style>
