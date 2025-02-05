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
        const response = await fetch('/assets/state_capitals.json')
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
    }
  },
  getters: {
    getInitialRoute: (state) => state.initialRoute,
    getTempRange: (state) => state.tempRange
  }
})