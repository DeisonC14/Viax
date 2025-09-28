// src/pages/Registro.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ConfirmationResult } from "firebase/auth";
import { sendLoginCodeWithRemember, confirmLoginCode } from "../services/phone";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
// arriba
import { getAdditionalUserInfo } from "firebase/auth";


export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("+57"); // E.164
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [existingUser, setExistingUser] = useState(false); // 👈 nuevo estado
  const navigate = useNavigate();

  const onSendCode = async () => {
    try {
      setErr(null);
      setOk(false);
      setExistingUser(false);
      setLoading(true);

      // Validación mínima: Colombia +57 + 10 dígitos
      if (!/^\+57\d{10}$/.test(telefono)) {
        setErr("Ingresa un teléfono válido en formato +573001234567.");
        return;
      }

      // true => recordarme
      const c = await sendLoginCodeWithRemember(telefono, true);
      setConfirmation(c);
    } catch (e: any) {
      setErr("No se pudo enviar el SMS. Verifica el número o la configuración.");
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
  if (!confirmation) return;
  try {
    setErr(null);
    setLoading(true);

    const cred = await confirmLoginCode(confirmation, code); // devuelve UserCredential
    const { user } = cred;
    const info = getAdditionalUserInfo(cred);
    const isNew = info?.isNewUser === true;

    if (isNew) {
      await setDoc(
        doc(db, "users", user.uid),
        {
          nombre: nombre || null,
          telefono,
          createdAt: new Date().toISOString(),
          provider: "phone",
        },
        { merge: true }
      );
      setOk(true);
      navigate("/", { replace: true });
    } else {
      // usuario ya existente (aquí tu lógica de UI / redirección)
      // p.ej.: setExistingUser(true) o navigate("/login")
    }
  } catch (e: any) {
    setErr("Código inválido o expirado.");
  } finally {
    setLoading(false);
  }
};


  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center bg-cover bg-center p-4 pt-24 pb-8"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      {/* reCAPTCHA para Phone Auth (invisible) */}
      <div id="recaptcha-container" />

      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-6 drop-shadow">Registro</h2>

        <div className="min-h-[20px] mb-2">
          {err && <p className="text-red-400 text-sm">{err}</p>}
          {ok && <p className="text-green-400 text-sm">Registro exitoso.</p>}
          {existingUser && (
            <p className="text-yellow-300 text-sm">
              Usuario ya registrado. Por favor inicia sesión.
            </p>
          )}
        </div>

        {/* Si detectamos usuario existente, mostramos solo el CTA para ir al login */}
        {existingUser ? (
          <>
            <button
              onClick={goToLogin}
              className="mt-4 w-full h-12 bg-[#74F28C] text-gray-900 text-lg font-bold rounded-2xl shadow hover:bg-[#5cbf7f] transition"
            >
              Iniciar sesión
            </button>

            <p className="mt-6 text-center text-sm text-gray-200">
              ¿Quieres intentar con otro número?{" "}
              <button
                onClick={() => {
                  setExistingUser(false);
                  setConfirmation(null);
                  setCode("");
                  setErr(null);
                }}
                className="text-[#74F28C] font-semibold hover:underline"
              >
                Volver al registro
              </button>
            </p>
          </>
        ) : (
          <>
            {/* NOMBRE */}
            <div className="mb-4 text-left">
              <label className="block text-gray-200 mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-white/30 bg-transparent text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#74F28C]"
                placeholder="Tu nombre"
              />
            </div>

            {/* TELÉFONO (E.164) */}
            {!confirmation && (
              <div className="mb-4 text-left">
                <label className="block text-gray-200 mb-1">Teléfono (E.164)</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full border border-white/30 bg-transparent text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#74F28C]"
                  placeholder="+573001234567"
                />
              </div>
            )}

            {/* CÓDIGO SMS */}
            {confirmation && (
              <div className="mb-4 text-left">
                <label className="block text-gray-200 mb-1">Código SMS</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-white/30 bg-transparent text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#74F28C]"
                  placeholder="123456"
                />
              </div>
            )}

            {/* BOTONES */}
            {!confirmation ? (
              <button
                onClick={onSendCode}
                disabled={loading}
                className="mt-2 w-full h-12 bg-[#74F28C] text-gray-900 text-lg font-bold rounded-2xl shadow hover:bg-[#5cbf7f] transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar código"}
              </button>
            ) : (
              <button
                onClick={onConfirm}
                disabled={loading}
                className="mt-2 w-full h-12 bg-[#74F28C] text-gray-900 text-lg font-bold rounded-2xl shadow hover:bg-[#5cbf7f] transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Verificando..." : "Confirmar código"}
              </button>
            )}

            <p className="mt-6 text-center text-sm text-gray-200">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={goToLogin}
                className="text-[#74F28C] font-semibold hover:underline"
              >
                Iniciar sesión
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
