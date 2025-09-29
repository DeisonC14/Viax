// src/pages/Bloqueado.tsx
import { Link } from "react-router-dom";

export default function Bloqueado() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      <div className="w-full max-w-md bg-[rgba(41,39,39,0.35)] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_5px_30px_#000] p-8 text-center">
        <img src="/images/viax-logo.png" alt="VIAX" className="mx-auto mb-4 h-12 w-auto" />
        <h1 className="text-2xl font-extrabold text-white mb-3">Cuenta bloqueada</h1>
        <p className="text-gray-200 mb-6">
          Tu cuenta ha sido bloqueada por un administrador. Si crees que se trata de un error,
          por favor contáctanos.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center h-12 rounded-3xl border border-white/40 text-white hover:border-emerald-400 hover:text-emerald-300 transition"
          >
            Ir al inicio
          </Link>
          <a
            href="mailto:soporte@tu-dominio.com?subject=Cuenta%20bloqueada"
            className="inline-flex items-center justify-center h-12 rounded-3xl bg-emerald-400 text-gray-900 font-semibold hover:bg-emerald-300 transition"
          >
            Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
}
