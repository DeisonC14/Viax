// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { sendLoginCodeWithRemember, confirmLoginCode } from "../services/phone";
import type { ConfirmationResult } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import type { Role } from "../hooks/useAuth";
import { setAuthPersistence } from "../services/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const { loading, user, role, signInWithGoogle, refreshClaims } = useAuth();

  const [telefono, setTelefono] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // /login?switch=1  => evita auto-redirección si vienes desde Home
  const forceSwitch = new URLSearchParams(location.search).get("switch") === "1";

  const goToRole = (r: Role) => {
    if (r === "superadmin") navigate("/superadmin", { replace: true });
    else if (r === "admin") navigate("/admin", { replace: true });
    else navigate("/", { replace: true });
  };

  useEffect(() => {
    if (forceSwitch) return;
    if (!loading && user && role) goToRole(role);
  }, [loading, user, role, forceSwitch, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-100">
        <p className="text-gray-600">Cargando…</p>
      </div>
    );
  }

  // Enviar SMS / Confirmar código
  const onPrimary = async () => {
    if (step === "phone") {
      try {
        setErr(null);
        setBusy(true);
        if (!/^\+57\d{10}$/.test(telefono)) {
          setErr("Ingresa un número válido en formato +573001234567.");
          return;
        }
        const c = await sendLoginCodeWithRemember(telefono, remember);
        setConfirmation(c);
        setStep("code");
      } catch (e: any) {
        console.error("SMS error:", e);
        switch (e?.code) {
          case "auth/invalid-phone-number":
            setErr("Número inválido. Usa el formato +573001234567.");
            break;
          case "auth/operation-not-allowed":
            setErr("El inicio por teléfono no está habilitado en Firebase.");
            break;
          case "auth/app-not-authorized":
            setErr("Dominio no autorizado en Firebase Authentication.");
            break;
          case "auth/captcha-check-failed":
            setErr("Fallo en reCAPTCHA. Recarga la página e inténtalo de nuevo.");
            break;
          default:
            setErr("No se pudo enviar el SMS. Verifica el número o inténtalo más tarde.");
        }
      } finally {
        setBusy(false);
      }
    } else {
      if (!confirmation) return;
      try {
        setErr(null);
        setBusy(true);

        // 1) Confirma el código (loguea al usuario)
        await confirmLoginCode(confirmation, code);

        // 2) Refresca claims
        await refreshClaims();

        // 3) Espeja/actualiza doc del usuario (sin tocar 'role')
        const u = auth.currentUser;
        if (u) {
          await setDoc(
            doc(db, "users", u.uid),
            {
              uid: u.uid,
              displayName: u.displayName ?? "",
              email: u.email ?? "",
              phone: telefono || u.phoneNumber || "",
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // 4) Redirección inmediata si venías con switch=1
        if (forceSwitch) {
          const token = await auth.currentUser?.getIdTokenResult(false);
          const r = (token?.claims.role as Role) ?? "cliente";
          goToRole(r);
        }
        // Si no, el useEffect hará la redirección
      } catch (e: any) {
        console.error("Confirm code error:", e);
        const codeErr = e?.code as string | undefined;
        if (codeErr === "auth/user-disabled") {
          // Usuario bloqueado: redirigir a pantalla informativa
          navigate("/bloqueado", { replace: true });
          return;
        }
        switch (codeErr) {
          case "auth/invalid-verification-code":
            setErr("Código inválido. Verifica e inténtalo de nuevo.");
            break;
          case "auth/code-expired":
            setErr("El código expiró. Vuelve a enviarlo.");
            setStep("phone");
            setConfirmation(null);
            setCode("");
            break;
          default:
            setErr("Código inválido o expirado.");
        }
      } finally {
        setBusy(false);
      }
    }
  };

  // Google Sign-In
  const onLoginWithGoogle = async () => {
    try {
      setErr(null);
      setBusy(true);

      // Persistencia según "Recordarme"
      await setAuthPersistence(remember);

      // El hook ya hace signIn + refreshClaims + espejo en users/{uid}
      await signInWithGoogle();

      // Redirecciona por rol
      const token = await auth.currentUser?.getIdTokenResult(false);
      const r = (token?.claims.role as Role) ?? "cliente";
      goToRole(r);
    } catch (e: any) {
      console.error("Google sign-in error:", e);
      const codeErr = e?.code as string | undefined;
      if (codeErr === "auth/user-disabled") {
        navigate("/bloqueado", { replace: true });
        return;
      }
      switch (codeErr) {
        case "auth/operation-not-allowed":
          setErr("Google no está habilitado (Authentication → Métodos de acceso).");
          break;
        case "auth/unauthorized-domain":
          setErr("Dominio no autorizado. Agrega tu dominio en Authentication → Configuración → Dominios autorizados.");
          break;
        case "auth/popup-blocked":
          setErr("El navegador bloqueó la ventana. Permite popups y vuelve a intentar.");
          break;
        case "auth/popup-closed-by-user":
          setErr("Cerraste la ventana de Google antes de completar el inicio.");
          break;
        default:
          setErr("No se pudo iniciar con Google");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center bg-cover bg-center p-4 pt-24 pb-8"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      {/* Contenedor requerido para reCAPTCHA invisible */}
      <div id="recaptcha-container" />

      {/* Wrapper relativo para posicionar el logo sin que lo recorte la card */}
      <div className="relative w-full max-w-md">
        {/* Logo sobresaliendo (responsivo) */}
        <img
          src="/images/marca-icon-blanco.png"
          alt="Logo"
          className="
            absolute left-1/2 -translate-x-1/2 z-10
            -top-12 sm:-top-14 md:-top-16
            w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28
            rounded-full object-cover drop-shadow-lg
          "
        />

        {/* Card glassmorphism */}
        <div
          className="
            w-full min-h-[32rem]
            bg-[rgba(41,39,39,0.3)] backdrop-blur-lg
            border border-white/20 rounded-3xl
            shadow-[0_5px_30px_#000]
            p-6 sm:p-8 pt-16 sm:pt-20 md:pt-24
            flex flex-col text-center
          "
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 drop-shadow">
            Iniciar sesión
          </h2>

          {/* Zona de error */}
          <div className="min-h-[20px] mb-2">
            {err && <p className="text-red-400 text-sm">{err}</p>}
          </div>

          {/* Teléfono */}
          <div className="mb-4 text-left">
            <label className="block text-gray-200 mb-1">Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full border border-white/30 bg-transparent text-white placeholder-gray-300
                         rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#74F28C]"
              placeholder="+573001234567"
            />
          </div>

          {/* Código SMS */}
          <div className="mb-4 text-left relative">
            <label className="block text-gray-200 mb-1">Código SMS</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-white/30 bg-transparent text-white placeholder-gray-300
                           rounded-lg px-3 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-[#74F28C]"
                placeholder={step === "phone" ? "— Se enviará al solicitar —" : "123456"}
                disabled={step === "phone"}
              />
              <span className="absolute inset-y-0 right-2 flex items-center text-transparent select-none">•</span>
            </div>
          </div>

          {/* Recordarme */}
          <label className="mb-2 inline-flex items-center gap-2 text-gray-200 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-transparent text-[#74F28C] focus:ring-[#74F28C]"
            />
            Recordarme en este dispositivo
          </label>

          {/* Botón principal (SMS) */}
          <button
            onClick={onPrimary}
            disabled={busy}
            className="mt-2 w-full h-14 bg-[#74F28C] text-gray-900 text-lg font-bold
                       rounded-3xl shadow hover:bg-[#5cbf7f] transition transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {step === "phone" ? (busy ? "Enviando…" : "Iniciar sesión") : (busy ? "Verificando…" : "Iniciar sesión")}
          </button>

          {/* Botón Google */}
          <button
            onClick={onLoginWithGoogle}
            aria-label="Continuar con Google"
            title="Continuar con Google"
            className="mt-3 mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-800 shadow hover:shadow-md transform hover:scale-110 transition"
          >
            <img src="/images/google.png" alt="Google" className="w-8 h-8" />
          </button>

          <p className="mt-6 text-center text-sm text-gray-200">
            ¿No tienes cuenta?{" "}
            <button onClick={() => navigate("/registro")} className="text-[#74F28C] font-semibold hover:underline">
              Crear cuenta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
