const YIELD_INTERVAL = 1000
const STAGNATION_THRESHOLD = 5000

export class State {
  constructor(
    public name: string,
    public lat: number,
    public lon: number,
    public temperatures: number[]
  ) { }

  distanceTo(other: State): number {
    const R = 3958.8 // Earth radius in miles
    const dLat = (other.lat - this.lat) * (Math.PI / 180)
    const dLon = (other.lon - this.lon) * (Math.PI / 180)
    const lat1 = this.lat * (Math.PI / 180)
    const lat2 = other.lat * (Math.PI / 180)

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }
}

export class RouteOptimizer {
  private bestRoute: State[] = [];
  private stagnationCount = 0;
  private iterationCount = 0;
  private maxDistance: number

  constructor(private initialRoute: State[], initialMaxDistance = 600) {
    this.maxDistance = initialMaxDistance
  }

  private async findRoute(
    current: State,
    visited: State[],
    remaining: State[]
  ) {
    visited.push(current)

    if (visited.length > this.bestRoute.length) {
      this.bestRoute = [...visited]
      this.stagnationCount = 0
    } else {
      this.stagnationCount++
    }

    if (this.stagnationCount >= STAGNATION_THRESHOLD) return

    const candidates = remaining
      .filter((state) => current.distanceTo(state) <= this.maxDistance)
      .sort((a, b) => current.distanceTo(a) - current.distanceTo(b))

    for (const next of candidates) {
      const newRemaining = remaining.filter((state) => state !== next)
      this.iterationCount++

      if (this.iterationCount % YIELD_INTERVAL === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      await this.findRoute(next, [...visited], newRemaining)

      if (this.stagnationCount >= STAGNATION_THRESHOLD) break
    }
  }

  private twoOpt(route: State[]): State[] {
    let improved = true

    while (improved) {
      improved = false
      for (let i = 1; i < route.length - 1; i++) {
        for (let j = i + 1; j < route.length; j++) {
          const newRoute = [...route]
          newRoute.splice(i, j - i + 1, ...route.slice(i, j + 1).reverse())

          const currentDistance =
            route[i - 1].distanceTo(route[i]) +
            route[j].distanceTo(route[(j + 1) % route.length])
          const newDistance =
            newRoute[i - 1].distanceTo(newRoute[i]) +
            newRoute[j].distanceTo(newRoute[(j + 1) % newRoute.length])

          if (newDistance < currentDistance) {
            route = newRoute
            improved = true
          }
        }
      }
    }

    return route
  }

  public async findOptimalRoute(): Promise<State[]> {
    let routeFound = false

    while (!routeFound) {
      this.bestRoute = []
      this.iterationCount = 0
      this.stagnationCount = 0

      const randomIndex = Math.floor(Math.random() * this.initialRoute.length)
      const start = this.initialRoute[randomIndex]
      const remaining = [...this.initialRoute]

      remaining.splice(randomIndex, 1)

      await this.findRoute(start, [], remaining)

      if (this.bestRoute.length === this.initialRoute.length) {
        routeFound = true
      } else {
        this.maxDistance += 50
      }
    }

    return this.twoOpt(this.bestRoute)
  }
}