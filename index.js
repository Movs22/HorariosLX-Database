const Database = require("./CacheDatabase")
const WebSocket = require('ws');

const DB = new Database();

const ws = new WebSocket.Server({ port: 6000 });

ws.on('connection', ws => {
    console.log('Client connected')

    ws.on('message', m => {
        const { type, data } = JSON.parse(m)

        try {
            switch(type) {
                case 'addTrip':
                    DB.addTrip(data.vehicleId, data.tripId, data.lineId, data.shiftId, data.startTimestamp);
                    ws.send(JSON.stringify({ status: 'success' }));
                    break;
                case 'pushUpdate':
                    DB.pushUpdate(data.tripId, data.lat, data.lon, data.stopId, data.timestamp);
                    ws.send(JSON.stringify({ status: 'success' }));
                    break;
                case 'getVehicleHistory':
                    const history = DB.getVehicleHistory(data.vehicleId);
                    ws.send(JSON.stringify({ status: 'success', data: history }));
                    break;
                case 'getVehicleTrip':
                    const trip = DB.getLatestVehicleHistory(data.vehicleId);
                    ws.send(JSON.stringify({ status: 'success', data: trip }))
                    break;
                case 'getShiftTrips':
                    const shiftTrips = DB.getShiftTrips(data.shiftId);
                    ws.send(JSON.stringify({ status: 'success', data: shiftTrips }))
                    break;
                case 'getLineTrips':
                    const lineTrips = DB.getLineTrips(data.lineId);
                    ws.send(JSON.stringify({ status: 'success', data: lineTrips }))
                    break;
                default:
                    ws.send(JSON.stringify({ status: 'error', message: 'Unknown type' }))
            }
        } catch (err) {
            ws.send(JSON.stringify({status: 'error', message: err.message}))
        }
    })

    ws.on('close', () => console.log('Client disconnected'))
})

