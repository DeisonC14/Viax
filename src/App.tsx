// src/App.tsx
import { Link } from "react-router-dom";

function App() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 bg-[url('../public/images/background.jpg')]"
    >
      <div className="relative w-full max-w-md h-[26rem] bg-[rgba(41,39,39,0.3)] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_5px_30px_#000] p-8 pt-28 flex flex-col text-center">
        {/* Logo sobresaliendo */}
        <img
          src="/images/marca-icon-blanco.png"
          alt="Logo"
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full object-cover drop-shadow-lg sm-w-300 sm-h-30"
        />

        {/* Título */}
        <h1 className="text-4xl font-extrabold text-white mt-6 mb-10 drop-shadow-lg">
          Bienvenido a Viax
        </h1>

        {/* Texto informativo */}
        <p className="text-lg text-gray-200 drop-shadow mb-8 font-semibold leading-relaxed">
          Tu plataforma para gestionar y descubrir dónde puedes tomar el
          transporte público más cercano hasta tu destino.
        </p>

        {/* Botón anclado abajo */}
        <Link
          to="/login"
          className="mt-auto inline-flex items-center justify-center w-full h-14 bg-[#74F28C] text-gray-900 text-lg font-bold rounded-3xl shadow hover:bg-[#5cbf7f] transition transform hover:scale-105"
        >
          Ingresar
        </Link>
      </div>
    </div>
  );
}

export default App;
