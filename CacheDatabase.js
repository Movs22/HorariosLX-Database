const fs = require("fs")

class CacheDatabase {
    constructor(dataDir = "./data") {
        this.dataDir = dataDir;
        this.trips = new Map();
        this.vehicleHistory = new Map();
        this.lines = new Map();
        this.tripUpdates = new Map();
        this.shifts = new Map();

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    _getFilePath(date) {
        return path.join(this.dataDir, `${date}.json`);
    }

    addTrip(vehicleId, tripId, lineId, shiftId, startTimestamp) {
        if(this.trips.get(tripId)) throw new Error("Duplicate entry");
        const tripMetadata = { vehicleId, lineId, startTimestamp, shiftId }
        const date = new Date(startTimestamp).toISOString().split('T')[0];
        tripMetadata.date = date;

        this.trips.set(tripId, tripMetadata);

        if(!this.vehicleHistory.has(vehicleId)) {
            this.vehicleHistory.set(vehicleId, []);
        }

        this.vehicleHistory.get(vehicleId).push(tripId);

        if(!this.lines.has(lineId)) {
            this.lines.set(lineId, []);
        }

        if(!this.shifts.has(shiftId)) {
            this.shifts.set(shiftId, []);
        }

        this.lines.get(lineId).push(tripId);

        this.shifts.get(shiftId).push(tripId);

        this.tripUpdates.set(tripId, []);
    }

    pushUpdate(tripId, lat, lon, stopId, timestamp) {
        if(!this.tripUpdates.has(tripId)) throw new Error(`Trip ID ${tripId} does not exist.`);
        this.tripUpdates.get(tripId).push({lat, lon, stopId, timestamp})
    }

    getVehicleHistory(vehicleId) {
        const tripIds = this.vehicleHistory.get(vehicleId) || [];
        return tripIds.map(tripId => ({
            tripId,
            meta: this.trips.get(tripId),
            updates: this.tripUpdates.get(tripId),
        }));
    }

    getLatestVehicleHistory(vehicleId) {
        const tripIds = this.vehicleHistory.get(vehicleId) || [];
        const latestTripId = tripIds[tripIds.length - 1];
        return {
            tripId: latestTripId,
            meta: this.trips.get(latestTripId),
            updates: this.tripUpdates.get(latestTripId) || null,
        }
    }

    getShiftTrips(shiftId) {
        const tripIds = this.shifts.get(shiftId) || [];
        return tripIds.map(tripId => ({
            tripId,
            meta: this.trips.get(tripId),
            updates: this.tripUpdates.get(tripId),
        }));;
    }

    getLineTrips(lineId) {
        const tripIds = this.lines.get(lineId) || [];
        return tripIds.map(tripId => ({
            tripId,
            meta: this.trips.get(tripId),
            updates: this.tripUpdates.get(tripId),
        }));;
    }

    offloadCompletedTrips() {
        const today = new Date().toISOString().split('T')[0];
        const tripsToOffload = [];

        this.trips.forEach((metadata, tripId) => {
            if (metadata.date !== today) {
                tripsToOffload.push(tripId);
            }
        });

        tripsToOffload.forEach(tripId => {
            const metadata = this.trips.get(tripId);
            const updates = this.tripUpdates.get(tripId);
            const filePath = this._getFilePath(metadata.date);

            const data = {
                tripId,
                metadata,
                updates,
            };

            fs.appendFileSync(filePath, JSON.stringify(data) + '\n', 'utf-8');

            this.trips.delete(tripId);
            this.tripUpdates.delete(tripId);
        });
    }

    loadDayData(date) {
        const filePath = this._getFilePath(date);
        if (!fs.existsSync(filePath)) {
            throw new Error(`No data found for date ${date}`);
        }

        const data = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
        return data.map(line => JSON.parse(line));
    }
}

module.exports = CacheDatabase;