// scripts/set-claims.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  path.join(__dirname, "serviceAccount.json");

let svc: ServiceAccount;
try {
  svc = JSON.parse(fs.readFileSync(keyPath, "utf8"));
} catch (e) {
  console.error(`No pude leer credenciales en: ${keyPath}`);
  console.error(e);
  process.exit(1);
}

initializeApp({ credential: cert(svc) });

// ---------- parseo robusto de argumentos ----------
const raw = process.argv.slice(2).filter(a => a !== "--");

let email: string | undefined =
  raw.find(a => a.includes("@")) ?? process.env.SUPERADMIN_EMAIL ?? undefined;

let uid: string | undefined =
  // --uid <UID>
  (() => {
    const i = raw.findIndex(a => a === "--uid");
    if (i >= 0 && raw[i + 1]) return raw[i + 1];
    return undefined;
  })()
  // --uid=<UID>
  ?? (raw.find(a => a.startsWith("--uid="))?.slice("--uid=".length))
  // Un único arg sin @ => UID
  ?? (raw.length === 1 && !raw[0].includes("@") ? raw[0] : undefined)
  // Env var
  ?? process.env.SUPERADMIN_UID
  ?? undefined;

if (!email && !uid) {
  console.error(
    "Uso:\n" +
    "  npm run bootstrap:superadmin -- <email>\n" +
    "  npm run bootstrap:superadmin -- --uid <UID>\n" +
    "  npm run bootstrap:superadmin -- --uid=<UID>\n" +
    "  (o bien) SUPERADMIN_UID=<UID> npm run bootstrap:superadmin"
  );
  process.exit(1);
}

(async () => {
  const auth = getAuth();
  const db = getFirestore();

  const userRec = uid
    ? await auth.getUser(uid)
    : await auth.getUserByEmail(email!);

  await auth.setCustomUserClaims(userRec.uid, { role: "superadmin" });
  await db.doc(`users/${userRec.uid}`).set(
    { uid: userRec.uid, email: userRec.email, role: "superadmin" },
    { merge: true }
  );

  console.log(`OK → ${userRec.email} (uid=${userRec.uid}) ahora es SUPERADMIN`);
  console.log("Recuerda: el usuario debe volver a iniciar sesión o usar getIdToken(true).");
})().catch(e => { console.error(e); process.exit(1); });
