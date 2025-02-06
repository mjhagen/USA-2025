<script setup lang="ts">
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'

const tempRange = defineModel<[number, number]>()
</script>

<template>
  <Slider v-model="tempRange" :min="0" :max="100" :step="1" range class="w-96 z-10" />
</template>

<style scoped>
.slider {
  margin: 0 1rem;
}
</style>
