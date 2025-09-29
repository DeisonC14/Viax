// src/components/RouteEditorLeaflet.tsx
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import { useCallback, useMemo } from "react";
import type { LatLng } from "../types/Route";
import "../lib/leaflet-setup";

function FitToPath({ path }: { path: LatLng[] }) {
  const map = useMap();
  useMemo(() => {
    if (!path || path.length === 0) return;
    const latLngs = path.map((p) => [p.lat, p.lng]) as [number, number][];
    // @ts-expect-error leaflet types ok en runtime
    const bounds = window.L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [path, map]);
  return null;
}

export default function RouteEditorLeaflet({
  value,
  onChange,
  height = "60vh",
  center = { lat: 4.65, lng: -74.05 }, // Bogotá por defecto
  zoom = 12,
}: {
  value: LatLng[];
  onChange: (next: LatLng[]) => void;
  height?: string;
  center?: LatLng;
  zoom?: number;
}) {
  const handleClick = useCallback(
    (e: any) => {
      const lat = e.latlng.lat as number;
      const lng = e.latlng.lng as number;
      onChange([...value, { lat, lng }]);
    },
    [value, onChange]
  );

  const undo = () => onChange(value.slice(0, -1));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={value.length === 0}
          className="px-3 h-9 rounded-lg border border-gray-300 hover:border-emerald-400 disabled:opacity-60"
        >
          Deshacer punto
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={value.length === 0}
          className="px-3 h-9 rounded-lg border border-gray-300 hover:border-red-400 disabled:opacity-60"
        >
          Limpiar
        </button>
        <div className="text-sm text-gray-600 ml-auto">
          Puntos: <b>{value.length}</b>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 shadow">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          style={{ height }}
          whenCreated={(map) => {
            // click para añadir puntos
            // @ts-expect-error
            map.on("click", handleClick);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {value.length > 0 && (
            <>
              <Polyline positions={value.map((p) => [p.lat, p.lng]) as any} />
              <Marker position={[value[0].lat, value[0].lng]} />
              {value.length > 1 && (
                <Marker position={[value[value.length - 1].lat, value[value.length - 1].lng]} />
              )}
              <FitToPath path={value} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">
        Haz click en el mapa para añadir puntos. Deshaz o limpia para corregir.
      </p>
    </div>
  );
}
