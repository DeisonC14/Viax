// src/services/roles.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "../lib/firebase"; // 👈 asegúrate de exportar `app` en lib/firebase
import { collection, query, where, limit, getDocs } from "firebase/firestore";

export type Role = "cliente" | "admin" | "superadmin";

// Usar la MISMA región donde desplegaste tus funciones (us-central1)
const functions = getFunctions(app, "us-central1");

// Callable v2 en backend: setUserRoleV2
const setUserRoleFn = httpsCallable<
  { uid?: string; email?: string; role: Role },
  { ok: true; uid: string; email: string | null; role: Role }
>(functions, "setUserRoleV2");

/**
 * Asigna/cambia el rol usando el UID.
 * Requiere que el caller tenga rol "superadmin" (se valida en el backend).
 */
export async function updateUserRoleByUid(uid: string, role: Role) {
  try {
    const res = await setUserRoleFn({ uid, role });
    return res.data;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.error("setUserRoleV2 by UID error:", err);

    // Mensajes más útiles según código
    if (err.code === "functions/permission-denied") {
      throw new Error("No autorizado: necesitas rol superadmin.");
    }
    if (err.code === "functions/not-found") {
      throw new Error("El usuario no existe en Authentication.");
    }
    throw new Error(err.message ?? "No se pudo asignar el rol (UID).");
  }
}

/**
 * Asigna/cambia el rol usando el email.
 * Requiere que el caller tenga rol "superadmin" (se valida en el backend).
 */
export async function updateUserRoleByEmail(email: string, role: Role) {
  try {
    const res = await setUserRoleFn({ email, role });
    return res.data;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.error("setUserRoleV2 by Email error:", err);

    if (err.code === "functions/permission-denied") {
      throw new Error("No autorizado: necesitas rol superadmin.");
    }
    if (err.code === "functions/not-found") {
      throw new Error(
        "El correo no está registrado en Authentication. " +
          "Pídele al usuario que inicie sesión al menos una vez."
      );
    }
    throw new Error(err.message ?? "No se pudo asignar el rol (email).");
  }
}

/**
 * Busca en Firestore un uid por email exacto (si el usuario ya inició alguna vez).
 * Útil para validar si el perfil existe en `users/{uid}` antes de intentar acciones.
 */
export async function findUidByEmailFromFirestore(
  email: string
): Promise<string | null> {
  const q = query(
    collection(db, "users"),
    where("email", "==", email),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}
