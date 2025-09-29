// src/components/RouteViewerLeaflet.tsx
import { MapContainer, TileLayer, Polyline, Marker, useMap, Circle, Tooltip } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import type { LatLng, RouteRow } from "../types/Route";
import { nearestOnPath } from "../lib/geo";
import "../lib/leaflet-setup";

function FitAll({ center, path }: { center?: LatLng; path?: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    const latLngs: [number, number][] = [];
    if (center) latLngs.push([center.lat, center.lng]);
    if (path?.length) path.forEach((p) => latLngs.push([p.lat, p.lng]));
    if (latLngs.length) {
      // @ts-expect-error
      const b = window.L.latLngBounds(latLngs);
      map.fitBounds(b, { padding: [24, 24] });
    }
  }, [center, path, map]);
  return null;
}

export default function RouteViewerLeaflet({
  routes,
  destination, // requerido
  showGeolocation = true,
}: {
  routes: RouteRow[];
  destination: LatLng;
  showGeolocation?: boolean;
}) {
  const [me, setMe] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!showGeolocation || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [showGeolocation]);

  // Ruta más cercana al DESTINO
  const picked = useMemo(() => {
    let best:
      | {
          route: RouteRow;
          nearest: { closest: LatLng; distanceMeters: number };
        }
      | null = null;

    for (const r of routes) {
      if (!r.active || !r.path || r.path.length < 2) continue;
      const near = nearestOnPath(destination, r.path);
      if (!near) continue;
      if (!best || near.distanceMeters < best.nearest.distanceMeters) {
        best = { route: r, nearest: { closest: near.closest, distanceMeters: near.distanceMeters } };
      }
    }
    return best;
  }, [routes, destination]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow">
      <MapContainer center={[destination.lat, destination.lng]} zoom={13} style={{ height: "70vh" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Todas las rutas tenues */}
        {routes.map(
          (r) =>
            r.path &&
            r.path.length > 1 && (
              <Polyline
                key={r.id}
                positions={r.path.map((p) => [p.lat, p.lng]) as any}
                pathOptions={{ opacity: 0.3 }}
              />
            )
        )}

        {/* Destino */}
        <Marker position={[destination.lat, destination.lng]}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            Destino
          </Tooltip>
        </Marker>

        {/* Mi ubicación */}
        {me && (
          <Circle center={[me.lat, me.lng]} radius={8}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              Tú
            </Tooltip>
          </Circle>
        )}

        {/* Ruta elegida y punto más cercano */}
        {picked && picked.route.path && (
          <>
            <Polyline
              positions={picked.route.path.map((p) => [p.lat, p.lng]) as any}
              pathOptions={{ weight: 6 }}
            />
            <Marker position={[picked.nearest.closest.lat, picked.nearest.closest.lng]}>
              <Tooltip direction="top" offset={[0, -10]} permanent>
                Punto cercano a tu destino ({Math.round(picked.nearest.distanceMeters)} m)
              </Tooltip>
            </Marker>
            <FitAll center={destination} path={picked.route.path} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
