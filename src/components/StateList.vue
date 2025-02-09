<template>
  <ul class="list-none">
    <li v-for="(state, index) in initialRoute" :key="state.name" class="mb-2 p-2 bg-white rounded shadow">
      <strong>{{ index + 1 }}. {{ state.name }}</strong>
      <div>{{ dates[index].date.toDateString() }}</div>
      <div>{{ dates[index].temp }}</div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateDateAndTemp } from '../utils/dateUtils'
import { useRouteStore } from '../stores/data'
import { storeToRefs } from 'pinia'

const { initialRoute, tempRange } = storeToRefs(useRouteStore())

const dates = computed(() =>
  initialRoute.value.map((state, index) =>
    calculateDateAndTemp(state, index, tempRange.value)
  )
)
</script>