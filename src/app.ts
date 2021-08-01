import express, { Request } from 'express';
import { query, param, validationResult } from 'express-validator';
import cors from 'cors';
import { FlightNetwork, Params } from './flight-network';
import { loadFlightData } from './flight-data';

loadFlightData().then(({ airports, routesGraph, nearestAirportsGraph }) => {
    createServer(new FlightNetwork(
        airports,
        routesGraph,
        nearestAirportsGraph
    ));
});

export const createServer = (graph: FlightNetwork) => {
    const app = express();

    const corsOptions: cors.CorsOptions = {
        origin: ['http://localhost:3000']
    }

    app.use(cors(corsOptions));

    app.get('/', (req, res) => {
        res.send('running');
    });

    app.get('/:startCode-:destCode',
        param('startCode').isString().isLength({ min: 3, max: 4 }),
        param('destCode').isString().isLength({ min: 3, max: 4 }),
        query('maxLegs').optional().isNumeric().toInt(),
        query('checkPerimeter').optional().isBoolean().toBoolean(),
        async (req: Request<Pick<Params, 'startCode' | 'destCode'>, {}, {}, Pick<Params, 'maxLegs' | 'checkPerimeter'>>, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            res.send(graph.shortestRoute({ ...req.query, ...req.params }));
        }
    );

    app.listen(3000);
    console.log('ready...http://localhost:3000');

    return app;
}