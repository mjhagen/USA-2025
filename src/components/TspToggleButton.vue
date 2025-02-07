<template>
  <button @click="store.sortRouteTSP(100)" class="px-4 py-2 text-white rounded bg-blue-500 hover:bg-blue-600"
    :disabled="store.sorting">
    <span v-if="store.sorting">
      Sorting Route...
    </span>
    <span v-else>Sort Route</span>
  </button>
</template>

<script setup type="ts">
import { useRouteStore } from '../stores/data'
const store = useRouteStore()
</script>