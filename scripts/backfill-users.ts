// scripts/backfill-users.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
// @ts-ignore
import serviceAccount from "./serviceAccount.json" assert { type: "json" };

initializeApp({ credential: cert(serviceAccount as any) });

async function run() {
  const auth = getAuth();
  const db = getFirestore();
  let next: string | undefined;
  let created = 0, merged = 0;

  do {
    const page = await auth.listUsers(1000, next);
    for (const u of page.users) {
      const ref = db.doc(`users/${u.uid}`);
      const snap = await ref.get();

      const payload = {
        uid: u.uid,
        displayName: u.displayName ?? "",
        email: u.email ?? "",
        phone: u.phoneNumber ?? "",
        role: (u.customClaims?.role as any) ?? "cliente",
        providerIds: u.providerData.map(p => p.providerId),
        createdAt: snap.exists ? snap.get("createdAt") ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      };

      await ref.set(payload, { merge: true });
      if (snap.exists) merged++; else created++;
    }
    next = page.pageToken;
  } while (next);

  console.log(`Listo. Creados: ${created}, Actualizados: ${merged}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
