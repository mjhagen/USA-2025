import { defineStore } from 'pinia'

interface State {
  name: string
  lat: number
  lon: number
  temperatures: number[]
}

export const useRouteStore = defineStore('route', {
  state: () => ({
    initialRoute: [] as State[],
    tempRange: [65, 75] as [number, number]
  }),
  actions: {
    async loadFromLocalStorage() {
      const savedRoute = localStorage.getItem('routeData')
      const savedTempRange = localStorage.getItem('tempRange')

      if (savedRoute) {
        this.initialRoute = JSON.parse(savedRoute)
      } else {
        const response = await fetch('./assets/state_capitals.json')
        const stateData = await response.json()

        this.initialRoute = Object.keys(stateData).map((key) => ({
          name: key,
          lat: stateData[key].coordinates[0],
          lon: stateData[key].coordinates[1],
          temperatures: stateData[key].temperatures
        }))
      }

      if (savedTempRange) {
        this.tempRange = JSON.parse(savedTempRange)
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('routeData', JSON.stringify(this.initialRoute))
      localStorage.setItem('tempRange', JSON.stringify(this.tempRange))
    },

    updateRoute(newRoute: State[]) {
      this.initialRoute = newRoute
      this.saveToLocalStorage()
    },

    updateTempRange(newRange: [number, number]) {
      this.tempRange = newRange
      this.saveToLocalStorage()
    },

    // 🚀 TSP Sorting Algorithm
    sortRouteTSP() {
      if (this.initialRoute.length < 2) return

      const distance = (a: State, b: State) => {
        const R = 6371 // Earth radius in km
        const dLat = (b.lat - a.lat) * (Math.PI / 180)
        const dLon = (b.lon - a.lon) * (Math.PI / 180)
        const lat1 = a.lat * (Math.PI / 180)
        const lat2 = b.lat * (Math.PI / 180)

        const aVal = Math.sin(dLat / 2) ** 2 +
          Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
        const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))

        return R * c
      }

      const tspRoute: State[] = []
      const unvisited = [...this.initialRoute]
      let current = unvisited.shift()
      if (current) tspRoute.push(current)

      while (unvisited.length > 0) {
        const nearest = unvisited.reduce((closest, city) => {
          const distToCurrent = distance(current!, city)
          const distToClosest = distance(current!, closest)
          return distToCurrent < distToClosest ? city : closest
        }, unvisited[0])

        current = nearest
        tspRoute.push(nearest)
        unvisited.splice(unvisited.indexOf(nearest), 1)
      }

      this.initialRoute = tspRoute
      this.saveToLocalStorage()  // Save the sorted route
    }
  },

  getters: {
    getInitialRoute: (state) => state.initialRoute,
    getTempRange: (state) => state.tempRange
  }
})