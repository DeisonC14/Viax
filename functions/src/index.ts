/* eslint-disable object-curly-spacing, require-jsdoc, max-len */
import {initializeApp} from "firebase-admin/app";
import {getAuth, type UserRecord, type UserInfo} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError, type CallableRequest} from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1";

initializeApp();

type Role = "cliente" | "admin" | "superadmin";

/**
 * Callable v2 para cambiar el rol de un usuario.
 * Solo puede llamar un SUPERADMIN (claim "role").
 * data: { uid?: string; email?: string; role: Role }
 */
export const setUserRole = onCall<{uid?: string; email?: string; role: Role}>(
  {region: "us-central1"},
  async (
    req: CallableRequest<{uid?: string; email?: string; role: Role}>
  ): Promise<{ok: true; uid: string; email: string | null; role: Role}> => {
    const caller = req.auth;
    const callerRole = (caller?.token as {role?: string} | undefined)?.role ?? undefined;
    if (!caller || callerRole !== "superadmin") {
      throw new HttpsError("permission-denied", "No autorizado");
    }

    const data = req.data ?? {};
    const role = data.role;
    const uidParam = data.uid;
    const emailParam = data.email;

    if (!role || (!uidParam && !emailParam)) {
      throw new HttpsError(
        "invalid-argument",
        "Parámetros inválidos: provee uid o email, y role."
      );
    }

    const auth = getAuth();
    const db = getFirestore();

    let userRecord: UserRecord;
    if (uidParam) {
      userRecord = await auth.getUser(uidParam);
    } else {
      userRecord = await auth.getUserByEmail(String(emailParam));
    }

    await auth.setCustomUserClaims(userRecord.uid, {role});
    await db.doc(`users/${userRecord.uid}`).set(
      {
        uid: userRecord.uid,
        email: userRecord.email ?? null,
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    return {ok: true, uid: userRecord.uid, email: userRecord.email ?? null, role};
  }
);

/**
 * Espeja datos de Auth en Firestore al crear un usuario.
 */
export const mirrorAuthUser = functionsV1.auth.user().onCreate(
  async (user: UserRecord) => {
    const db = getFirestore();
    await db.doc(`users/${user.uid}`).set(
      {
        uid: user.uid,
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        phone: user.phoneNumber ?? "",
        role: (user.customClaims as {role?: Role} | undefined)?.role ?? "cliente",
        providerIds: ((user.providerData as UserInfo[] | undefined) ?? []).map(
          (p: UserInfo) => p.providerId
        ),
        createdAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );
  }
);

/**
 * Bloquea / desbloquea a un usuario y refleja en Firestore.
 * data: { uid: string; disabled: boolean }
 */
export const setUserDisabled = onCall<{uid: string; disabled: boolean}>(
  {region: "us-central1"},
  async (
    req: CallableRequest<{uid: string; disabled: boolean}>
  ): Promise<{ok: true; uid: string; disabled: boolean}> => {
    const caller = req.auth;
    const callerRole = (caller?.token as {role?: string} | undefined)?.role ?? undefined;
    if (!caller || callerRole !== "superadmin") {
      throw new HttpsError("permission-denied", "No autorizado");
    }

    const uid = req.data?.uid;
    const disabled = req.data?.disabled;
    if (!uid || typeof disabled !== "boolean") {
      throw new HttpsError("invalid-argument", "Parámetros inválidos.");
    }

    const auth = getAuth();
    const db = getFirestore();

    const target = await auth.getUser(uid);
    const targetRole = (target.customClaims as {role?: Role} | undefined)?.role ?? "cliente";
    if (targetRole === "superadmin") {
      throw new HttpsError("failed-precondition", "No puedes bloquear al superadmin.");
    }

    await auth.updateUser(uid, {disabled});
    if (disabled) await auth.revokeRefreshTokens(uid);

    await db.doc(`users/${uid}`).set(
      {
        disabled,
        status: disabled ? "blocked" : "active",
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    return {ok: true, uid, disabled};
  }
);

/**
 * Elimina usuario de Auth y su doc en Firestore.
 * data: { uid: string }
 */
export const deleteUser = onCall<{uid: string}>(
  {region: "us-central1"},
  async (
    req: CallableRequest<{uid: string}>
  ): Promise<{ok: true; uid: string}> => {
    const caller = req.auth;
    const callerRole = (caller?.token as {role?: string} | undefined)?.role ?? undefined;
    if (!caller || callerRole !== "superadmin") {
      throw new HttpsError("permission-denied", "No autorizado");
    }

    const uid = req.data?.uid;
    if (!uid) {
      throw new HttpsError("invalid-argument", "Falta uid.");
    }

    const auth = getAuth();
    const db = getFirestore();

    const target = await auth.getUser(uid);
    const targetRole = (target.customClaims as {role?: Role} | undefined)?.role ?? "cliente";
    if (targetRole === "superadmin") {
      throw new HttpsError("failed-precondition", "No puedes eliminar al superadmin.");
    }

    await auth.deleteUser(uid);
    await db.doc(`users/${uid}`).delete();

    return {ok: true, uid};
  }
);
