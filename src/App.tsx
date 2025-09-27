// src/App.tsx
<<<<<<< HEAD
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { loginGoogle, loginEmail, signupEmail, logout } from "./services/auth";
import { Routes, Route, useNavigate } from "react-router-dom";
import Registro from "./Registro";

function App() {
  const { user, loading } = useAuth();
  const [telefono, setTelefono] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Cargando…</p>
      </div>
    );
  }

  const onSignup = async () => {
    try {
      setErr(null);
      await signupEmail(telefono, pass); // 👈 se usa teléfono
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const onLogin = async () => {
    try {
      setErr(null);
      await loginEmail(telefono, pass); // 👈 se usa teléfono
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-[url('assets/background.jpg')] flex items-center justify-center p-4">
            <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
                Iniciar sesión
              </h2>

              <div className="mb-4">
                <label className="block text-gray-600 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="300 123 4567"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-600 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="********"
                />
              </div>

              {err && <p className="text-red-500 text-sm mb-4">{err}</p>}

              <button
                onClick={onLogin}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Iniciar sesión
              </button>

              <p className="mt-4 text-center text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => navigate("/registro")}
                  className="text-blue-500 hover:underline"
                >
                  Crear cuenta
                </button>
              </p>
            </div>
          </div>
        }
      />
      <Route path="/registro" element={<Registro />} />
    </Routes>
=======
import { Link } from "react-router-dom";

function App() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      <div className="relative w-full max-w-md h-[30rem] bg-[rgba(41,39,39,0.3)] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_5px_30px_#000] p-8 pt-28 flex flex-col text-center">
        {/* Logo sobresaliendo */}
        <img
          src="/images/marca-icon-blanco.png"
          alt="Logo"
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-50 h-50 rounded-full object-cover drop-shadow-2xl"
        />

        {/* Título */}
        <h1 className="text-4xl font-extrabold text-white mt-6 mb-10 drop-shadow-lg">
          Bienvenido a Viax
        </h1>

        {/* Texto informativo más abajo */}
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
>>>>>>> 1b20a19 (registro)
  );
}

export default App;
