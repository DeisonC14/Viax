// src/services/auth.ts
import {
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

/** Configura la persistencia antes de un inicio de sesión */
export async function setAuthPersistence(remember: boolean) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

/** Login con Google respetando "Recordarme" */
export async function loginGoogleWithRemember(remember: boolean) {
  await setAuthPersistence(remember);
  return signInWithPopup(auth, googleProvider);
}

/** Cerrar sesión */
export function logout() {
  return signOut(auth);
}
