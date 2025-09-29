// scripts/backfill-roles.ts
import fs from "node:fs";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const SERVICE_JSON = process.env.SERVICE_ACCOUNT_JSON || "scripts/serviceAccount.json";

// Inicializa Admin SDK (usa serviceAccount si existe, si no, ADC)
if (fs.existsSync(SERVICE_JSON)) {
  const creds = JSON.parse(fs.readFileSync(SERVICE_JSON, "utf-8"));
  initializeApp({ credential: cert(creds) });
  console.log(`✅ Usando credenciales: ${SERVICE_JSON}`);
} else {
  initializeApp({ credential: applicationDefault() });
  console.log("✅ Usando Application Default Credentials (ADC)");
}

const auth = getAuth();
const db = getFirestore();

type Role = "cliente" | "admin" | "superadmin";

async function backfill() {
  const snap = await db.collection("users").orderBy("email").get();
  console.log(`🔎 Documentos en 'users/': ${snap.size}`);

  let updated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const uid = d.id;
    const data = d.data() as { role?: Role } | undefined;

    // Lee el usuario en Auth para ver si tiene claim de rol
    let ur: UserRecord | null = null;
    let claimRole: Role | null = null;
    try {
      ur = await auth.getUser(uid);
      claimRole = (ur.customClaims as any)?.role ?? null;
    } catch {
      // Puede no existir en Auth → no es fatal
    }

    const docRole = (data?.role as Role | undefined) ?? null;
    const effective: Role = (claimRole || docRole || "cliente") as Role;

    // Si ya está correcto, omite
    if (docRole === effective) {
      skipped++;
      continue;
    }

    await db.doc(`users/${uid}`).set(
      {
        role: effective,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✔ backfill users/${uid} → role=${effective}`);
    updated++;
  }

  console.log(`\n✅ Backfill terminado. Actualizados: ${updated}, Sin cambios: ${skipped}`);
}

backfill()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error en backfill:", e);
    process.exit(1);
  });
