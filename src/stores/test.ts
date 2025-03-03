import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../public/assets/state_capitals.json'); // JSON file with lat/lng and temperatures

const TEMP_MIN = 10, TEMP_MAX = 30; // Temperature range constraint
const START_STATE = 'North Carolina';
const END_STATE = 'Washington';
const START_DATE_INDEX = 83; // March 24
const END_DATE_INDEX = 334; // December 1

// Load state data from JSON
const stateData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const STATES = Object.keys(stateData).filter(state => state !== START_STATE && state !== END_STATE);

/** Haversine formula to estimate distances between coordinates */
function haversineDistance(coord1: number[], coord2: number[]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Generates an initial route using a nearest-neighbor heuristic */
function generateInitialRoute(): string[] {
    let unvisited = new Set(STATES);
    let currentState = START_STATE;
    let route = [];

    while (unvisited.size > 0) {
        let nearestState = [...unvisited].reduce((nearest, state) => {
            const dist = haversineDistance(stateData[currentState].coordinates, stateData[state].coordinates);
            return !nearest || dist < nearest.dist ? { state, dist } : nearest;
        }, null)?.state;
        
        if (nearestState) {
            route.push(nearestState);
            unvisited.delete(nearestState);
            currentState = nearestState;
        }
    }
    return route;
}

/** Evaluates the fitness of a route */
function evaluateRoute(route: string[]): number {
    let totalDistance = 0;
    let tempPenalty = 0;
    let dateIndex = START_DATE_INDEX;
    const totalDays = END_DATE_INDEX - START_DATE_INDEX;
    const totalArea = STATES.reduce((sum, state) => sum + stateData[state].area, 0);
    const weightedDaysPerState = STATES.reduce((acc, state) => {
        acc[state] = Math.round((stateData[state].area / totalArea) * totalDays);
        return acc;
    }, {} as Record<string, number>);
    
    const fullRoute = [START_STATE, ...route, END_STATE];
    
    for (let i = 0; i < fullRoute.length - 1; i++) {
        totalDistance += haversineDistance(stateData[fullRoute[i]].coordinates, stateData[fullRoute[i + 1]].coordinates);
        const temp = stateData[fullRoute[i]].temperatures[dateIndex];
        if (temp < TEMP_MIN || temp > TEMP_MAX) tempPenalty += 1000; // Penalize routes outside temperature range
        dateIndex = (dateIndex + weightedDaysPerState[fullRoute[i]]) % 365;
    }
    return totalDistance + tempPenalty;
}

/** 2.5-opt optimization with priority-based swaps */
function twoPointFiveOpt(route: string[]): string[] {
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 1; i < route.length - 2; i++) {
            for (let j = i + 1; j < route.length; j++) {
                let newRoute = [...route];
                newRoute = newRoute.slice(0, i).concat(newRoute.slice(i, j).reverse(), newRoute.slice(j));
                if (evaluateRoute(newRoute) < evaluateRoute(route)) {
                    route = newRoute;
                    improved = true;
                }
                
                // Prioritize swaps where states are out of order based on longitude
                if (j < route.length - 1) {
                    const long1 = stateData[newRoute[j]].coordinates[1];
                    const long2 = stateData[newRoute[j + 1]].coordinates[1];
                    if (long1 > long2) {
                        [newRoute[j], newRoute[j + 1]] = [newRoute[j + 1], newRoute[j]];
                        if (evaluateRoute(newRoute) < evaluateRoute(route)) {
                            route = newRoute;
                            improved = true;
                        }
                    }
                }
            }
        }
    }
    return route;
}

/** Runs the genetic algorithm with nearest-neighbor initialization and 2.5-opt */
async function geneticAlgorithm(iterations: number = 100): Promise<string[]> {
    let population = Array.from({ length: 20 }, generateInitialRoute);
    
    for (let i = 0; i < iterations; i++) {
      const bestRoutes = population.sort((a, b) => evaluateRoute(a) - evaluateRoute(b)).slice(0, 5);
      console.log(bestRoutes)
        
        let newPopulation: string[][] = [];
        while (newPopulation.length < 20) {
            const parent1 = bestRoutes[Math.floor(Math.random() * bestRoutes.length)];
            const parent2 = bestRoutes[Math.floor(Math.random() * bestRoutes.length)];
            let child = [...parent1.slice(0, parent1.length / 2), ...parent2.slice(parent2.length / 2)];
            child = Array.from(new Set(child)); // Remove duplicates
            if (Math.random() < 0.1) child.reverse(); // Simple mutation
            newPopulation.push(twoPointFiveOpt(child)); // Apply enhanced 2.5-opt for refinement
        }
        population = newPopulation;
    }
    return [START_STATE, ...population[0], END_STATE];
}

(async () => {
    console.log("Optimal Route:", await geneticAlgorithm());
})();