// src/pages/AdminAgregarRuta.tsx
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import RouteEditorLeaflet from "../components/RouteEditorLeaflet";
import AddressSearch from "../components/AddressSearch";
import type { LatLng } from "../types/Route";
import "../lib/leaflet-setup";

export default function AdminAgregarRuta() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  // Header UI
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Form state
  const [name, setName] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [activa, setActiva] = useState(true);
  const [path, setPath] = useState<LatLng[]>([]); // ← polilínea
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const goPerfil = () => { navigate("/perfil"); setMenuOpen(false); };
  const goHomeAdmin = () => { navigate("/admin", { replace: true }); };
  const doLogout = async () => { await logOut(); navigate("/", { replace: true }); };

  const navLink =
    "px-3 py-2 border-b-2 border-transparent hover:border-emerald-400 " +
    "text-gray-800 hover:text-emerald-500 transition";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) {
      setErr("El nombre de la ruta es obligatorio.");
      return;
    }
    if (path.length < 2) {
      setErr("Dibuja la ruta (al menos 2 puntos) antes de guardar.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "routes"), {
        name: name.trim(),
        originAddress: origen.trim() || null,
        destinationAddress: destino.trim() || null,
        company: empresa.trim() || null,
        active: !!activa,
        path, // ← guardamos la polilínea
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(),
      });

      alert("Ruta creada correctamente.");
      navigate("/admin/rutas", { replace: true });
    } catch (e) {
      console.error(e);
      setErr("No se pudo guardar la ruta. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER (igual que ya tenías) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center gap-4">
            <button onClick={goHomeAdmin} className="shrink-0" aria-label="Ir a inicio de Admin" title="VIAX">
              <img src="/images/viax-logo.png" alt="VIAX" className="h-9 w-auto sm:h-10 select-none" />
            </button>
            <nav className="hidden sm:flex items-center gap-1 ml-2">
              <span className="px-3 py-2 border-b-2 border-emerald-400 text-emerald-600 font-medium">
                Agregar ruta
              </span>
              <button onClick={goPerfil} className={navLink}>Perfil</button>
              <button
                onClick={doLogout}
                className="px-3 py-2 border-b-2 border-transparent text-emerald-600 hover:border-emerald-500 transition"
              >
                Cerrar sesión
              </button>
            </nav>
            <div className="sm:hidden ml-auto" ref={menuRef}>
              {/* …tu hamburguesa móvil si la usas… */}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4 grid md:grid-cols-2 gap-6">
          {/* Formulario */}
          <section className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-4 shadow">
            <h2 className="text-lg font-semibold mb-4">Nueva ruta</h2>
            {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la ruta *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Ej: Ruta A - Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Origen (texto opcional)</label>
                <AddressSearch
                  placeholder="Buscar dirección de origen…"
                  onSelect={(s) => setOrigen(s.label)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Destino (texto opcional)</label>
                <AddressSearch
                  placeholder="Buscar dirección de destino…"
                  onSelect={(s) => setDestino(s.label)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Empresa (opcional)</label>
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Nombre de la empresa"
                />
              </div>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
                />
                Activa
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 h-12 rounded-xl bg-emerald-400 text-gray-900 font-semibold hover:bg-emerald-300 disabled:opacity-70"
                >
                  {saving ? "Guardando…" : "Guardar ruta"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/rutas")}
                  className="px-5 h-12 rounded-xl border border-gray-300 hover:border-emerald-400"
                >
                  Cancelar
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-3">
              * Dibuja la polilínea en el mapa de la derecha (mínimo 2 puntos).
            </p>
          </section>

          {/* Editor de mapa (dibujar) */}
          <section>
            <RouteEditorLeaflet value={path} onChange={setPath} />
          </section>
        </div>
      </main>
    </div>
  );
}
