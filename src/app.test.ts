
import haversine from 'haversine';
import { FlightNetwork } from './flight-network';

describe('App', () => {
    it('shortest path', async () => {
        const fn = new FlightNetwork([
            { iata: 'A', icao: '', lat: 1, lng: 1 },
            { iata: 'B', icao: '', lat: 1, lng: 1 },
            { iata: 'C', icao: '', lat: 1, lng: 1 },
            { iata: 'D', icao: '', lat: 1, lng: 1 },
            { iata: 'E', icao: '', lat: 1, lng: 1 },
            { iata: 'F', icao: '', lat: 1, lng: 1 },
        ],
            {
                'A': {
                    'B': 300,
                },
                'B': {
                    'C': 120
                },
                'C': {
                    'E': 350
                },
                'D': {
                    'E': 420
                },
                'F': {
                    'E': 300
                }
            },
            {
                'B': {
                    'D': 70,
                    'F': 80
                },
            }
        );

        expect(fn.shortestRoute({ startCode: 'A', destCode: 'B' })).toBe('A->B');
        expect(fn.shortestRoute({ startCode: 'A', destCode: 'E' })).toBe('A->B->C->E');
        expect(fn.shortestRoute({ startCode: 'A', destCode: 'E', checkPerimeter: true })).toBe('A->B=>F->E');
        expect(fn.shortestRoute({ startCode: 'B', destCode: 'E' })).toBe('B->C->E');
        expect(fn.shortestRoute({ startCode: 'A', destCode: 'F' })).toBe('No route.');
    });
});