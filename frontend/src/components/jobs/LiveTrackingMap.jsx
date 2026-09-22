import { MapPinned, Navigation } from "lucide-react";

const toNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

const LiveTrackingMap = ({ destination, workerLocation, etaMinutes }) => {
  const destinationLatitude = toNumber(destination?.latitude);
  const destinationLongitude = toNumber(destination?.longitude);
  const workerLatitude = toNumber(workerLocation?.latitude);
  const workerLongitude = toNumber(workerLocation?.longitude);

  if (destinationLatitude === null || destinationLongitude === null) {
    return null;
  }

  const points = [
    [destinationLatitude, destinationLongitude],
    ...(workerLatitude !== null && workerLongitude !== null ? [[workerLatitude, workerLongitude]] : []),
  ];
  const latitudes = points.map(([latitude]) => latitude);
  const longitudes = points.map(([, longitude]) => longitude);
  const padding = 0.005;
  const bbox = [
    Math.min(...longitudes) - padding,
    Math.min(...latitudes) - padding,
    Math.max(...longitudes) + padding,
    Math.max(...latitudes) + padding,
  ].join(",");
  const marker = workerLatitude !== null && workerLongitude !== null
    ? `${workerLatitude},${workerLongitude}`
    : `${destinationLatitude},${destinationLongitude}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;

  return (
    <section className="details-card live-tracking-map">
      <div className="details-card-header">
        <h2><MapPinned size={19} /> Live Tracking</h2>
        {etaMinutes != null && <span className="tracking-eta"><Navigation size={15} /> ETA {etaMinutes} min</span>}
      </div>
      <iframe
        title="Live worker tracking map"
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p>{workerLatitude !== null ? "Worker location updates automatically while travelling." : "Waiting for the worker's live location."}</p>
    </section>
  );
};

export default LiveTrackingMap;
