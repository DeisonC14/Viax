// src/lib/geo.ts
import type { LatLng } from "../types/Route";

/** Haversine: distancia en metros entre A y B */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const h = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Aproxima lat/lng a coordenadas planas (metros) usando equirectangular */
function toXY(p: LatLng, refLat: number): { x: number; y: number } {
  const mPerDegLat = 111_132; // aprox
  const mPerDegLng = 111_320 * Math.cos((refLat * Math.PI) / 180);
  return {
    x: p.lng * mPerDegLng,
    y: p.lat * mPerDegLat,
  };
}

/** Punto más cercano de 'pt' sobre un segmento AB (aprox. plana) */
function nearestOnSegment(
  pt: LatLng,
  a: LatLng,
  b: LatLng
): { closest: LatLng; t: number; distMeters: number } {
  const refLat = (a.lat + b.lat) / 2;
  const P = toXY(pt, refLat);
  const A = toXY(a, refLat);
  const B = toXY(b, refLat);

  const ABx = B.x - A.x;
  const ABy = B.y - A.y;
  const APx = P.x - A.x;
  const APy = P.y - A.y;

  const ab2 = ABx * ABx + ABy * ABy || 1e-9;
  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));

  const Cx = A.x + ABx * t;
  const Cy = A.y + ABy * t;

  // Convertir de vuelta a lat/lng
  const lat = Cy / 111_132;
  const lng = Cx / (111_320 * Math.cos((refLat * Math.PI) / 180));

  const d = Math.hypot(P.x - Cx, P.y - Cy);
  return { closest: { lat, lng }, t, distMeters: d };
}

/** Punto más cercano de pt sobre una polilínea */
export function nearestOnPath(
  pt: LatLng,
  path: LatLng[]
): { closest: LatLng; distanceMeters: number; segmentIndex: number } | null {
  if (!path || path.length < 2) return null;
  let best: { closest: LatLng; distanceMeters: number; segmentIndex: number } | null = null;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const cand = nearestOnSegment(pt, a, b);
    if (!best || cand.distMeters < best.distanceMeters) {
      best = { closest: cand.closest, distanceMeters: cand.distMeters, segmentIndex: i };
    }
  }
  return best;
}
