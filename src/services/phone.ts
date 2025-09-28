// src/services/phone.ts
import { auth } from "../lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type UserCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

/** Crea/reinicia un reCAPTCHA invisible de forma segura */
export function ensureRecaptcha(containerId = "recaptcha-container") {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {}
    window.recaptchaVerifier = undefined;
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });
  return window.recaptchaVerifier!;
}

/** Configura persistencia según "recordarme" */
async function applyPersistence(remember: boolean) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}

/** Envía SMS para login/signup con teléfono, respetando "recordarme" */
export async function sendLoginCodeWithRemember(
  e164Phone: string,
  remember: boolean
): Promise<ConfirmationResult> {
  await applyPersistence(remember);
  const verifier = ensureRecaptcha();
  return signInWithPhoneNumber(auth, e164Phone, verifier);
}

/** Confirma el código recibido por SMS y devuelve el UserCredential completo */
export async function confirmLoginCode(
  confirmation: ConfirmationResult,
  code: string
): Promise<UserCredential> {
  return confirmation.confirm(code);
}
