// src/services/auth.ts
import { auth, googleProvider } from "../lib/firebase"; // o "../lib/firebase" si no usas alias
import {
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export const loginGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export const signupEmail = (email: string, pass: string) =>
  createUserWithEmailAndPassword(auth, email, pass);

export const loginEmail = (email: string, pass: string) =>
  signInWithEmailAndPassword(auth, email, pass);
