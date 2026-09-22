const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
    if (!from || !to) {
        return null;
    }

    const latitudeDelta = toRadians(to.latitude - from.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);
    const latitude = toRadians(from.latitude);

    const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(latitude) * Math.cos(toRadians(to.latitude))
        * Math.sin(longitudeDelta / 2) ** 2;

    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const calculateEta = (workerLocation, destination, averageSpeedKph = 30) => {
    const distanceKm = calculateDistanceKm(workerLocation, destination);

    if (distanceKm === null) {
        return { distanceKm: null, etaMinutes: null };
    }

    return {
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMinutes: Math.max(1, Math.ceil((distanceKm / averageSpeedKph) * 60))
    };
};

module.exports = {
    calculateEta
};
