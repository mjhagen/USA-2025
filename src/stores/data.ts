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
    async loadOriginalRouteFromFile() {
      const response = await fetch('./assets/state_capitals.json')
      const stateData = await response.json()

      return Object.keys(stateData).map((key) => ({
        name: key,
        lat: stateData[key].coordinates[0],
        lon: stateData[key].coordinates[1],
        temperatures: stateData[key].temperatures,
      }))
    },

    async loadFromLocalStorage() {
      const savedRoute = localStorage.getItem('routeData')
      const savedTempRange = localStorage.getItem('tempRange')

      if (savedRoute) {
        this.initialRoute = JSON.parse(savedRoute)
      } else {
        this.initialRoute = await this.loadOriginalRouteFromFile()
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

    async sortRouteTSP(initialMaxDistance: number = 600) {
      this.initialRoute = await this.loadOriginalRouteFromFile()
      if (this.initialRoute.length < 2) return

      const distance = (a: State, b: State) => {
        const R = 3958.8
        const dLat = (b.lat - a.lat) * (Math.PI / 180)
        const dLon = (b.lon - a.lon) * (Math.PI / 180)
        const lat1 = a.lat * (Math.PI / 180)
        const lat2 = b.lat * (Math.PI / 180)

        const aVal = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
        const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))

        return R * c
      }

      let bestRoute: State[] = []
      let iterationCount = 0
      let stagnationCount = 0
      const YIELD_INTERVAL = 1000
      const STAGNATION_THRESHOLD = 5000

      let maxDistance = initialMaxDistance
      let routeFound = false

      const startTime = performance.now()
      console.log(`Starting TSP calculation with initial maxDistance: ${maxDistance} miles`)

      while (!routeFound) {
        bestRoute = []
        iterationCount = 0
        stagnationCount = 0

        const findRoute = async (current: State, visited: State[], remaining: State[]) => {
          visited.push(current)

          if (visited.length > bestRoute.length) {
            bestRoute = [...visited]
            stagnationCount = 0
            console.log(`New best route found with length: ${bestRoute.length} (Iteration: ${iterationCount})`)
          } else {
            stagnationCount++
          }

          if (stagnationCount >= STAGNATION_THRESHOLD) return

          const candidates = remaining.filter(city => distance(current, city) <= maxDistance)

          for (const next of candidates) {
            const newRemaining = remaining.filter(city => city !== next)
            iterationCount++

            if (iterationCount % YIELD_INTERVAL === 0) {
              console.log(`Iteration: ${iterationCount}, Current best route length: ${bestRoute.length}`)
              await new Promise(resolve => setTimeout(resolve, 0))
            }

            await findRoute(next, [...visited], newRemaining)

            if (stagnationCount >= STAGNATION_THRESHOLD) break
          }
        }

        for (let i = 0; i < this.initialRoute.length; i++) {
          const start = this.initialRoute[i]
          const remaining = [...this.initialRoute]
          remaining.splice(i, 1)

          console.log(`Processing starting node ${i + 1}/${this.initialRoute.length}`)
          await findRoute(start, [], remaining)

          if (stagnationCount >= STAGNATION_THRESHOLD) break
        }

        if (bestRoute.length === this.initialRoute.length) {
          routeFound = true
          console.log(`Successfully found a complete route with maxDistance: ${maxDistance}`)
        } else {
          maxDistance += 50
          console.warn(`Incomplete route found. Increasing maxDistance to ${maxDistance} miles and retrying.`)
        }
      }

      const endTime = performance.now()
      console.log(`TSP calculation completed in ${(endTime - startTime).toFixed(2)} ms`)
      console.log(`Best route length found: ${bestRoute.length}`)

      if (routeFound) {
        this.initialRoute = bestRoute
        this.saveToLocalStorage()
      }
    }
  },

  getters: {
    getInitialRoute: (state) => state.initialRoute,
    getTempRange: (state) => state.tempRange
  }
})