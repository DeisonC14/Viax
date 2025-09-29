// src/pages/Admin.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Admin() {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  // UI
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Search
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");

  // Cerrar el menú al hacer click fuera
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
    const v = q.trim();
    setSubmittedQ(v);
  };

  const mapSrc =
    "https://www.google.com/maps?output=embed&q=" +
    encodeURIComponent(submittedQ || "Colombia");

  // Nav actions
  const goAgregarRuta = () => {
    navigate("/admin/agregar-ruta");
    setMenuOpen(false);
  };
  const goPerfil = () => {
    navigate("/perfil"); // ajusta si usas otra ruta
    setMenuOpen(false);
  };
  const goHomeAdmin = () => {
    navigate("/admin", { replace: true });
  };
  const goRutas = () => {
    navigate("/admin/rutas");
    setMenuOpen(false);
  };
  const doLogout = async () => {
    await logOut();
    navigate("/", { replace: true });
  };

  // Estilo común de enlaces (sin bg hover, con subrayado verde)
  const navLink =
    "px-3 py-2 border-b-2 border-transparent hover:border-emerald-400 " +
    "text-gray-800 hover:text-emerald-500 transition";

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center gap-4">
            {/* Logo (click -> /admin) */}
            <button
              onClick={goHomeAdmin}
              className="shrink-0 focus:outline-none"
              aria-label="Ir a inicio de Admin"
              title="VIAX"
            >
              <img
                src="/images/viax-logo.png"
                alt="VIAX"
                className="h-9 w-auto sm:h-10 select-none"
              />
            </button>

            {/* Buscador (siempre visible) */}
            <form onSubmit={submitSearch} className="flex-1 relative">
              {/* icono lupa */}
              <svg
                viewBox="0 0 24 24"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              >
                <path
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zM10 15a5 5 0 110-10 5 5 0 010 10z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar dirección…"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </form>

            {/* Enlaces en escritorio */}
            <nav className="hidden sm:flex items-center gap-1 ml-2">
              <button onClick={goRutas} className={navLink}>
                Rutas
              </button>
              <button onClick={goAgregarRuta} className={navLink}>
                Agregar ruta
              </button>
              <button onClick={goPerfil} className={navLink}>
                Perfil
              </button>
              <button
                onClick={doLogout}
                className="px-3 py-2 border-b-2 border-transparent text-emerald-600 hover:border-emerald-500 transition"
              >
                Cerrar sesión
              </button>
            </nav>

            {/* Menú hamburguesa (móvil) */}
            <div className="relative sm:hidden ml-1" ref={menuRef}>
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={() => setMenuOpen((s) => !s)}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={goRutas}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Rutas
                  </button>
                  <button
                    onClick={goAgregarRuta}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Agregar ruta
                  </button>
                  <button
                    onClick={goPerfil}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Perfil
                  </button>
                  <button
                    onClick={doLogout}
                    className="w-full text-left px-3 py-2 text-emerald-600 hover:bg-gray-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAPA */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4">
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow">
            <iframe
              title="Mapa"
              src={mapSrc}
              className="w-full h-[70vh]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {!submittedQ && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center px-6">
                  <p className="text-white text-lg sm:text-xl font-semibold drop-shadow">
                    Ingresa una direccion para empezar buscar tu ruta mas
                    cercana
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
