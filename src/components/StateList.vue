<script setup lang="ts">
import { computed } from 'vue'
import { calculateDateAndTemp } from '../utils/dateUtils'
import type { State } from '../models/State'

const props = defineProps<{
  route: State[]
  tempRange: [number, number]
}>()

const dates = computed(() =>
  props.route.map((state, index) =>
    calculateDateAndTemp(state, index, props.tempRange)
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
