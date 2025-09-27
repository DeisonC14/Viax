// src/App.tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { loginGoogle, loginEmail, signupEmail, logout } from "./services/auth";
import { Routes, Route, useNavigate } from "react-router-dom";
import Registro from "../Registro";

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
  );
}

export default App;