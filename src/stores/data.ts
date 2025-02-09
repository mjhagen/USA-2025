import { defineStore } from 'pinia'
import { RouteOptimizer, State } from '../models/State'

export const useRouteStore = defineStore('route', {
  state: () => ({
    initialRoute: [] as State[],
    tempRange: [15, 32] as [number, number],
    sorting: false
  }),

  actions: {
    async loadOriginalRouteFromFile() {
      const response = await fetch('./assets/state_capitals.json')
      const stateData = await response.json()

      return Object.keys(stateData).map((key) => new State(
        key,
        stateData[key].coordinates[0],
        stateData[key].coordinates[1],
        stateData[key].temperatures,
      ))
    },

    async loadFromLocalStorage() {
      const savedRoute = localStorage.getItem('routeData');
      const savedTempRange = localStorage.getItem('tempRange');
    
      if (savedRoute) {
        const rawData = JSON.parse(savedRoute);
        this.initialRoute = rawData.map(
          (s: any) => new State(s.name, s.lat, s.lon, s.temperatures)
        );
      } else {
        this.initialRoute = await this.loadOriginalRouteFromFile();
      }
    
      if (savedTempRange) {
        this.tempRange = JSON.parse(savedTempRange);
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

    async sortRouteTSP(initialMaxDistance = 600) {
      this.sorting = true

      const optimizer = new RouteOptimizer(this.initialRoute, initialMaxDistance)
      const bestRoute = await optimizer.findOptimalRoute()

      if (bestRoute.length > 0) {
        this.initialRoute = bestRoute
        this.saveToLocalStorage()
      }

      this.sorting = false
    }
  },

  getters: {
    getInitialRoute: (state) => state.initialRoute,
    getTempRange: (state) => state.tempRange
  }
})