// src/Registro.tsx
import { useState } from "react";
import { signupEmail } from "./services/auth"; // ⚠️ Ajusta si tu backend cambia
import { useNavigate } from "react-router-dom";

function Registro() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const onRegister = async () => {
    try {
      setErr(null);
      setSuccess(false);
      await signupEmail(telefono, pass); // 👈 se usa teléfono
      setSuccess(true);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[url('assets/background.jpg')] flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Registro
        </h2>

        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            placeholder="Tu nombre"
          />
        </div>

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
        {success && (
          <p className="text-green-600 text-sm mb-4">
            Registro exitoso. Ahora puedes iniciar sesión.
          </p>
        )}

        <button
          onClick={onRegister}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Registrarse
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:underline"
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default Registro;
=======
export default Registro;
>>>>>>> 1b20a19 (registro)
