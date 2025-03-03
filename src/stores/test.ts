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

    // Ensure Kansas & Nebraska are before Texas
    let kansasIdx = route.indexOf("Kansas");
    let nebraskaIdx = route.indexOf("Nebraska");
    let texasIdx = route.indexOf("Texas");
    if (kansasIdx > texasIdx || nebraskaIdx > texasIdx) {
        route.splice(texasIdx, 1);
        route.splice(Math.min(kansasIdx, nebraskaIdx), 0, "Texas");
    }

    // Ensure South Carolina & Georgia are before Midwest states
    let scIdx = route.indexOf("South Carolina");
    let gaIdx = route.indexOf("Georgia");
    let ilIdx = route.indexOf("Illinois");
    let kyIdx = route.indexOf("Kentucky");
    if (scIdx > ilIdx || gaIdx > kyIdx) {
        route.splice(ilIdx, 1);
        route.splice(Math.min(scIdx, gaIdx), 0, "Illinois");
    }
    return route;
}

/** Runs the genetic algorithm with nearest-neighbor initialization and 2.5-opt */
async function geneticAlgorithm(iterations: number = 100): Promise<string[]> {
    let population = Array.from({ length: 20 }, generateInitialRoute);
    
    for (let i = 0; i < iterations; i++) {
        const bestRoutes = population.sort((a, b) => evaluateRoute(a) - evaluateRoute(b)).slice(0, 5);
        
        let newPopulation: string[][] = [];
        while (newPopulation.length < 20) {
            const parent1 = bestRoutes[Math.floor(Math.random() * bestRoutes.length)];
            const parent2 = bestRoutes[Math.floor(Math.random() * bestRoutes.length)];
            let child = [...parent1.slice(0, parent1.length / 2), ...parent2.slice(parent2.length / 2)];
            child = Array.from(new Set(child)); // Remove duplicates
            if (Math.random() < 0.1) child.reverse(); // Simple mutation
            newPopulation.push(child);
        }
        population = newPopulation;
    }
    return [START_STATE, ...population[0], END_STATE];
}

(async () => {
    console.log("Optimal Route:", await geneticAlgorithm());
})();
