const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface OSRMResult {
  coords: [number, number][]; // [lat, lng] for Leaflet
  distanceM: number;
  durationS: number;
}

export interface GeocodedPoint {
  lat: number;
  lon: number;
}

export interface AllRoutesResult {
  originPoint: GeocodedPoint;
  destPoint: GeocodedPoint;
  cycling: OSRMResult;
  walking: OSRMResult;
  driving: OSRMResult;
}

export async function geocode(address: string): Promise<GeocodedPoint> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find location: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  const data = await res.json();
  const a = data.address || {};
  return (
    a.neighbourhood || a.suburb || a.quarter || a.city_district ||
    a.town || a.village || a.city ||
    `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  );
}

async function fetchOSRM(url: string, label: string): Promise<OSRMResult> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing failed (${label}): HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length)
    throw new Error(`No ${label} route found between these locations`);
  const route = data.routes[0];
  const coords: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
  );
  return { coords, distanceM: route.distance, durationS: route.duration };
}

const coord = (p: GeocodedPoint) => `${p.lon},${p.lat}`;
const qs = "?overview=full&geometries=geojson";

export async function fetchCyclingRouteDirect(
  origin: GeocodedPoint,
  dest: GeocodedPoint
): Promise<OSRMResult> {
  return fetchOSRM(
    `https://routing.openstreetmap.de/routed-bike/route/v1/cycling/${coord(origin)};${coord(dest)}${qs}`,
    "cycling"
  );
}

export async function fetchWalkingRouteDirect(
  origin: GeocodedPoint,
  dest: GeocodedPoint
): Promise<OSRMResult> {
  return fetchOSRM(
    `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coord(origin)};${coord(dest)}${qs}`,
    "walking"
  );
}

export async function fetchDrivingRouteDirect(
  origin: GeocodedPoint,
  dest: GeocodedPoint
): Promise<OSRMResult> {
  return fetchOSRM(
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coord(origin)};${coord(dest)}${qs}`,
    "driving"
  );
}

export async function fetchAllRoutes(
  origin: string,
  destination: string
): Promise<AllRoutesResult> {
  const [originPoint, destPoint] = await Promise.all([
    geocode(origin),
    geocode(destination),
  ]);

  const base = (profile: string, mode: string) =>
    `https://routing.openstreetmap.de/routed-${profile}/route/v1/${mode}/${coord(originPoint)};${coord(destPoint)}${qs}`;

  const [cycling, walking, driving] = await Promise.all([
    fetchOSRM(base("bike", "cycling"), "cycling"),
    fetchOSRM(base("foot", "foot"), "walking"),
    fetchOSRM(base("car", "driving"), "driving"),
  ]);

  return { originPoint, destPoint, cycling, walking, driving };
}
