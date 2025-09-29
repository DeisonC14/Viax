// src/pages/SuperAdmin.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SuperAdmin() {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQ(q.trim());
  };
  

  const mapSrc =
    "https://www.google.com/maps?output=embed&q=" +
    encodeURIComponent(submittedQ || "Colombia");

  const goAdministrar = () => { 
    navigate("/administrar"); 
    setMenuOpen(false); 
  };
  const goPerfil = () => { navigate("/perfil"); setMenuOpen(false); };
  const doLogout = async () => { await logOut(); navigate("/", { replace: true }); };

  // Enlaces con “barrita” sin background en hover
  const linkClass =
    "relative px-3 py-2 rounded-md font-medium text-slate-700 " +
    "hover:text-emerald-700 transition-colors " +
    "after:absolute after:left-3 after:right-3 after:-bottom-0.5 " +
    "after:h-[3px] after:rounded-full after:scale-x-0 after:bg-emerald-500 " +
    "after:transition-transform after:duration-200 hover:after:scale-x-100";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* HEADER una sola línea */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <img
            src="/images/logo-deliniado.png"
            alt="VIAX"
            className="h-10 w-auto sm:h-20 select-none"
          />

          {/* Buscador (ocupa el centro) */}
          <form onSubmit={submitSearch} className="flex-1">
            <div className="relative">
              {/* Lupita */}
              <svg
                viewBox="0 0 24 24"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
              >
                <path
                  d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar dirección…"
                className="w-full rounded-xl border border-gray-300 bg-white px-10 pr-12 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {/* Botón dentro del input */}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 active:scale-95"
                title="Buscar"
                aria-label="Buscar"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Enlaces derecha (desktop) */}
          <nav className="hidden sm:flex items-center gap-1 ml-auto">
            <button onClick={goAdministrar} className={linkClass}>
              Administrar
            </button>
            <button onClick={goPerfil} className={linkClass}>
              Perfil
            </button>
            <button
              onClick={doLogout}
              className={
                "relative px-3 py-2 rounded-md font-semibold text-emerald-700 " +
                "after:absolute after:left-3 after:right-3 after:-bottom-0.5 " +
                "after:h-[3px] after:rounded-full after:scale-x-0 after:bg-emerald-500 " +
                "after:transition-transform after:duration-200 hover:after:scale-x-100"
              }
            >
              Cerrar sesión
            </button>
          </nav>

          {/* Menú hamburguesa (móvil) a la derecha, misma línea */}
          <div className="sm:hidden relative ml-auto" ref={menuRef}>
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen((s) => !s)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <button onClick={goAdministrar} className="block w-full text-left px-4 py-3 hover:text-emerald-700">
                  Administrar
                </button>
                <button onClick={goPerfil} className="block w-full text-left px-4 py-3 hover:text-emerald-700">
                  Perfil
                </button>
                <button onClick={doLogout} className="block w-full text-left px-4 py-3 font-semibold text-emerald-700">
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAPA */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow">
            <iframe
              title="Mapa"
              src={mapSrc}
              className="w-full h-[70vh]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {!submittedQ && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <p className="text-white text-lg sm:text-xl font-semibold px-6 text-center drop-shadow">
                  Ingresa una direccion para empezar buscar tu ruta mas cercana
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
