// src/components/AddressSearch.tsx
import { useEffect, useRef, useState } from "react";

type Suggestion = {
  label: string;
  lat: number;
  lon: number;
};

export default function AddressSearch({
  placeholder = "Buscar dirección…",
  countryCodes = "co", // limita a Colombia; puedes cambiar o quitar
  onSelect,
}: {
  placeholder?: string;
  countryCodes?: string;
  onSelect: (s: Suggestion) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setList([]);
      setOpen(false);
      return;
    }
    // debounce 400ms
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        ctrl.current?.abort();
        ctrl.current = new AbortController();
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1` +
          `&limit=5&countrycodes=${encodeURIComponent(countryCodes)}&q=${encodeURIComponent(q)}` +
          `&email=contacto@tudominio.com`; // pon un correo de contacto real
        const res = await fetch(url, {
          signal: ctrl.current.signal,
          headers: { "Accept-Language": "es" },
        });
        const data = (await res.json()) as any[];
        setList(
          data.map((d) => ({
            label: d.display_name as string,
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
          }))
        );
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ctrl.current?.abort();
    };
  }, [q, countryCodes]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        onFocus={() => list.length && setOpen(true)}
        className="w-full rounded-lg border border-gray-300 pl-3 pr-3 py-2
                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
      {open && !!list.length && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow">
          {list.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              {s.label}
            </button>
          ))}
          {loading && <div className="px-3 py-2 text-sm text-gray-500">Buscando…</div>}
        </div>
      )}
      <div className="mt-1 text-xs text-gray-500">Datos © OpenStreetMap contributors.</div>
    </div>
  );
}
