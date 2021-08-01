import * as fs1 from 'fs';
import { promises as fs } from 'fs';
import csv from 'async-csv';
import haversine from 'haversine';
import { Airport, Graph } from './flight-network';

const SEARCH_RADIUS = 200;

export const loadFlightData = async () => {
    let airports, routesGraph, nearestAirportsGraph, radius;
    if (fs1.existsSync('./data.json')) {
        const data = await fs.readFile('./data.json', 'utf-8');
        ({ airports, routesGraph, nearestAirportsGraph, radius } = JSON.parse(data));

        if (radius === SEARCH_RADIUS) {
            return { airports, routesGraph, nearestAirportsGraph };
        }
    }

    airports = await loadAirports();
    routesGraph = await buildRouteGraph(airports);
    nearestAirportsGraph = buildNearestAirportsGraph(airports, routesGraph, SEARCH_RADIUS);

    await fs.writeFile('./data.json', JSON.stringify({
        airports, routesGraph, nearestAirportsGraph, radius: SEARCH_RADIUS
    }));

    return { airports, routesGraph, nearestAirportsGraph };
}

async function loadAirports(): Promise<Airport[]> {
    const airportsCsv = await fs.readFile('./airports.csv', 'utf-8');
    const airports = await csv.parse(airportsCsv) as Array<Array<any>>;
    airports.shift(); // remove header
    return airports.map((airport) => ({
        iata: airport[4] as string,
        icao: airport[5] as string,
        lat: airport[6] as number,
        lng: airport[7] as number
    }));
}

async function buildRouteGraph(airports: Airport[]): Promise<Graph> {
    const routesCsv = await fs.readFile('./routes.csv', 'utf-8');
    const routes = await csv.parse(routesCsv) as string[][];
    const routesGraph: Graph = {};

    for (let i = 1; i < routes.length; i++) {
        const startCode = routes[i][2];
        const destCode = routes[i][4];
        const startNode = routesGraph[startCode] ?? {};
        if (!startNode[destCode]) {
            const startAirport = airports.find((airport) => airport.iata === startCode) as Airport;
            const destAirport = airports.find((airport) => airport.iata === destCode) as Airport;
            startNode[destCode] = haversine(
                { latitude: startAirport.lat, longitude: startAirport.lng },
                { latitude: destAirport.lat, longitude: destAirport.lng }
            );
        }

        routesGraph[startCode] = startNode;
    }

    return routesGraph;
}

function buildNearestAirportsGraph(airports: Airport[], routesGraph: Graph, searchRadius: number) {
    const nearestAirportsGraph: Graph = {};
    for (let i = 0; i < airports.length; i++) {
        const current = airports[i];
        let nearest: { [key: string]: number } = {};
        for (let j = i; j < airports.length; j++) {
            const neighbour = airports[j];
            if (i === j || routesGraph?.[current.iata]?.[neighbour.iata]) continue;

            const d = haversine(
                { latitude: current.lat, longitude: current.lng },
                { latitude: neighbour.lat, longitude: neighbour.lng }
            );

            if (d < searchRadius) {
                nearest[neighbour.iata] = d;
            }
        }

        if (Object.keys(nearest).length) {
            nearestAirportsGraph[current.iata] = nearest;
        }
    }

    return nearestAirportsGraph;
}