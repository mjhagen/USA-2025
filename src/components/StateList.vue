<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { calculateDateAndTemp } from '../utils/dateUtils'

interface Props {
  route: Array<{ name: string; lat: number; lon: number; temperatures: number[] }>
  tempRange: [number, number]
}

const props = defineProps<Props>()

const dates = computed(() =>
  props.route.map((state, index) =>
    calculateDateAndTemp(state, index, props.tempRange) // Pass tempRange as the third argument
  )
)
</script>

<template>
  <div class="w-1/3 overflow-y-auto p-2 bg-gray-100">
    <ul class="list-none">
      <li v-for="(state, index) in props.route" :key="state.name" class="mb-2 p-2 bg-white rounded shadow">
        <strong>{{ index + 1 }}. {{ state.name }}</strong>
        <div>{{ dates[index].date.toDateString() }}</div>
        <div>{{ dates[index].temp }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
li {
  transition: background-color 0.3s ease;
}

li:hover {
  background-color: #e0f7fa;
}
</style>
