// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

export type Role = "cliente" | "admin" | "superadmin" | null;

type AuthContextValue = {
  user: User | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logOut: () => Promise<void>;
  /** Útil para refrescar los custom claims tras cambiar el rol desde el panel */
  refreshClaims: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // 1) Observa sesión y claims
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // No forzamos refresh siempre para evitar red extra
          const token = await getIdTokenResult(u, false);
          setRole((token.claims.role as Role) ?? "cliente");
        } catch {
          setRole("cliente");
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2) Si el usuario está bloqueado (users/{uid}.disabled === true), cerrar sesión de inmediato
  useEffect(() => {
    if (!user) return;
    const unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const d = snap.data() as any | undefined;
      // src/hooks/useAuth.tsx  (dentro del onSnapshot que ya agregamos)
if (d?.disabled === true) {
  signOut(auth).catch(() => {});
  setRole(null);
  // ➜ Pantalla informativa
  window.location.assign("/bloqueado");
}

    });
    return () => unsubDoc();
  }, [user?.uid]); // se re-suscribe al cambiar de usuario

  const refreshClaims = async () => {
    const u = auth.currentUser;
    if (!u) return;
    // Forzar refresh para leer claims actualizados
    await u.getIdToken(true);
    const token = await getIdTokenResult(u, false);
    setRole((token.claims.role as Role) ?? "cliente");
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    await refreshClaims();
  };

  const signInWithGoogle = async () => {
    // 1) Inicia sesión con Google
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);

    // 2) Refresca claims para capturar el rol (superadmin/admin/cliente)
    await refreshClaims();

    // 3) Espeja/actualiza doc del usuario (sin escribir 'role' desde el cliente)
    try {
      const u = auth.currentUser;
      if (u) {
        await setDoc(
          doc(db, "users", u.uid),
          {
            uid: u.uid,
            displayName: u.displayName ?? "",
            email: u.email ?? "",
            phone: u.phoneNumber ?? "",
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      // No bloquees el flujo si las reglas están más estrictas
      console.warn("Omitiendo write en users/{uid} por reglas:", e);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });

    // Crea/actualiza el documento del usuario (rol por defecto: cliente)
    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        email,
        displayName: displayName || cred.user.displayName || "",
        role: "cliente",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    await refreshClaims();
  };

  const logOut = async () => {
    await signOut(auth);
    setRole(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, role, loading, signIn, signInWithGoogle, register, logOut, refreshClaims }),
    [user, role, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
