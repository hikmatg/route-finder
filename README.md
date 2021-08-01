Run `docker compose up` and wait for the `ready...` message . It takes ~10 seconds to start the server first time. 

Use http://localhost:3000/{start_iata/start_icao}-{dest_iata/dest_icao} format to find the shortest route. 

Ex: http://localhost:3000/TLL-GYD
<br/>

## Additional query parameters

`maxLegs` (int) - maximum allowed flight legs. Default is `4`.

`checkPerimeter` (bool) - whether to check for airports that are close enough for change via ground. Default is `false`;

Ex: http://localhost:3000/TLL-GYD?maxLegs=5&checkPerimeter=true

Search radius is assigned to constant `SEARCH_RADIUS` in `./src/flight-data.ts`. Changing radius will regenarate graph.
<br/>

## Tests
Run `docker compose run api npm test`
<br/>

Note: Data is old and also had to remove some of the routes because they had either source or destination iata set to `null`. That's why sometimes it can't find the route even though there is in reality. 
