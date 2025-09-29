import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { blockUser, removeUser } from "../services/admin";
import type { Role } from "../hooks/useAuth";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import {
  updateUserRoleByUid,
  updateUserRoleByEmail,
  findUidByEmailFromFirestore,
} from "../services/roles";

type UserRow = {
  uid: string;
  role?: Role;
  email?: string | null;
  displayName?: string | null;
  phone?: string | null;
  company?: string | null; // para admins
  disabled?: boolean;
  status?: "active" | "blocked";
};

type RoleFilter = "all" | "cliente" | "admin";

// --------- Helpers UI ---------
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg p-5">
        {children}
      </div>
    </div>
  );
}

export default function Administrar() {
  const { user: me, role: myRole } = useAuth(); // ruta protegida solo superadmin

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [qText, setQText] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Formulario "Agregar"
  const [newRole, setNewRole] = useState<Exclude<Role, null>>("cliente");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Formulario "Editar"
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState<Exclude<Role, null>>("cliente");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Cargar todo y filtrar en memoria (para incluir docs sin 'role')
  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "users"), orderBy("email")));
      const data = snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      })) as UserRow[];
      setRows(data);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  // Normalizar rol -> si falta: "cliente"
  const filtered = useMemo(() => {
    const meUid = me?.uid;
    const q = qText.trim().toLowerCase();

    return rows
      // 1) fuera el propio superadmin conectado
      .filter((u) => u.uid !== meUid)
      // 2) normaliza rol
      .map((u) => ({
        ...u,
        _roleNorm: (u.role ?? "cliente") as Exclude<Role, null>,
      }))
      // 3) nunca listar superadmins
      .filter((u) => u._roleNorm !== "superadmin")
      // 4) filtrar por rol
      .filter((u) => {
        if (roleFilter === "cliente") return u._roleNorm === "cliente";
        if (roleFilter === "admin") return u._roleNorm === "admin";
        return u._roleNorm === "cliente" || u._roleNorm === "admin";
      })
      // 5) búsqueda local
      .filter((u) => {
        if (!q) return true;
        return (
          (u.email?.toLowerCase().includes(q) ?? false) ||
          (u.displayName?.toLowerCase().includes(q) ?? false) ||
          (u.company?.toLowerCase().includes(q) ?? false) ||
          (u.phone?.toLowerCase().includes(q) ?? false)
        );
      });
  }, [rows, roleFilter, qText, me?.uid]);

  // ---- Acciones de fila ----
  const doBlockToggle = async (u: UserRow & { _roleNorm: "cliente" | "admin" }) => {
    if (!confirm(`${u.disabled ? "Desbloquear" : "Bloquear"} a ${u.email || u.displayName || u.uid}?`)) return;
    await blockUser(u.uid, !u.disabled);
    setRows((list) =>
      list.map((x) =>
        x.uid === u.uid
          ? { ...x, disabled: !u.disabled, status: !u.disabled ? "blocked" : "active" }
          : x
      )
    );
  };

  const doDelete = async (u: UserRow & { _roleNorm: "cliente" | "admin" }) => {
    if (!confirm(`Eliminar PERMANENTEMENTEMENTE a ${u.email || u.displayName || u.uid}?`)) return;
    await removeUser(u.uid);
    setRows((list) => list.filter((x) => x.uid !== u.uid));
  };

  const openEdit = (u: UserRow & { _roleNorm: "cliente" | "admin" }) => {
    setEditUser(u);
    setEditRole(u.role ?? "cliente");
    setEditName(u.displayName ?? "");
    setEditEmail(u.email ?? "");
    setEditPhone(u.phone ?? "");
    setEditCompany(u.company ?? "");
    setEditError(null);
    setShowEdit(true);
  };

  // ---- Guardar: Agregar ----
  const onCreateUser = async () => {
    try {
      setAddError(null);
      setSavingAdd(true);

      const role = newRole; // 'superadmin' | 'admin' | 'cliente'
      const emailInput = newEmail.trim();
      const phoneInput = newPhone.trim();

      // Validaciones mínimas
      if (role === "admin" && !emailInput) {
        setAddError("Para ADMIN necesitas correo (email).");
        return;
      }
      if (role === "cliente" && !phoneInput) {
        setAddError("Para CLIENTE necesitas teléfono.");
        return;
      }

      // 1) Intenta encontrar el UID por Firestore (doc users) — case-insensitive usando rows locales
      let uidCandidate =
        rows.find((r) => (r.email ?? "").toLowerCase() === emailInput.toLowerCase())?.uid || null;

      // 2) Si no lo tenemos aún y tenemos email, intenta consulta exacta a Firestore (por si 'rows' no está fresco)
      if (!uidCandidate && emailInput) {
        uidCandidate = await findUidByEmailFromFirestore(emailInput);
      }

      // 3) Si sigue sin aparecer y hay email, intenta en Auth vía Cloud Function por EMAIL
      if (!uidCandidate && emailInput) {
        try {
          const res = await updateUserRoleByEmail(emailInput, role as any);
          uidCandidate = res.uid; // si existe en Auth, ya lo tenemos
        } catch (err: any) {
          // Si no existe en Auth, avisamos
          alert(
            "Este correo aún no tiene cuenta en la app.\nPídele que inicie sesión con Google al menos una vez y vuelve a asignarle el rol."
          );
          return;
        }
      }

      if (!uidCandidate) {
        // Caso cliente sin email, o no se logró mapear: aquí no asignamos claim.
        setAddError(
          "No fue posible ubicar el usuario. Verifica el correo (o que el usuario haya ingresado alguna vez)."
        );
        return;
      }

      // 4) A esta altura tenemos UID. Asegura el claim por UID (idempotente).
      await updateUserRoleByUid(uidCandidate, role as any);

      // 5) Crea/actualiza doc users/{uid}
      await setDoc(
        doc(db, "users", uidCandidate),
        {
          uid: uidCandidate,
          role,
          displayName: newName.trim() || null,
          email: emailInput || null,
          phone: phoneInput || null,
          company: role === "admin" ? newCompany.trim() || null : null,
          status: "active",
        },
        { merge: true }
      );

      // 6) Refrescar tabla local
      setRows((list) => {
        const i = list.findIndex((x) => x.uid === uidCandidate);
        const row: UserRow = {
          uid: uidCandidate!,
          role,
          displayName: newName || "",
          email: emailInput || undefined,
          phone: phoneInput || undefined,
          company: role === "admin" ? newCompany || undefined : undefined,
          status: "active",
        };
        if (i >= 0) {
          const copy = [...list];
          copy[i] = { ...copy[i], ...row };
          return copy;
        }
        return [row, ...list];
      });

      // Reset & cerrar
      setNewRole("cliente");
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewCompany("");
      setShowAdd(false);
    } catch (e: any) {
      console.error(e);
      setAddError("No se pudo crear/asignar. Revisa la consola.");
    } finally {
      setSavingAdd(false);
    }
  };

  // ---- Guardar: Editar ----
  const onSaveEdit = async () => {
    if (!editUser) return;
    try {
      setEditError(null);
      setSavingEdit(true);

      const newRoleValue = editRole;
      const hasRealUid = !editUser.uid.startsWith("pending_");

      if (hasRealUid && newRoleValue !== (editUser.role ?? "cliente")) {
        await updateUserRoleByUid(editUser.uid, newRoleValue as any);
      }

      await updateDoc(doc(db, "users", editUser.uid), {
        role: newRoleValue,
        displayName: editName.trim() || null,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        company: newRoleValue === "admin" ? editCompany.trim() || null : null,
      });

      setRows((list) =>
        list.map((x) =>
          x.uid === editUser.uid
            ? {
                ...x,
                role: newRoleValue,
                displayName: editName || "",
                email: editEmail || undefined,
                phone: editPhone || undefined,
                company: newRoleValue === "admin" ? editCompany || undefined : undefined,
              }
            : x
        )
      );

      setShowEdit(false);
      setEditUser(null);
    } catch (e: any) {
      console.error(e);
      setEditError("No se pudo guardar. Revisa la consola.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (myRole !== "superadmin") return <div className="p-4">No autorizado</div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/superadmin" className="inline-flex items-center gap-2">
            <img src="/images/viax-logo.png" alt="VIAX" className="h-9 w-auto sm:h-10 select-none" />
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">Todos (cliente + admin)</option>
              <option value="cliente">Clientes</option>
              <option value="admin">Administradores</option>
            </select>

            <div className="relative">
              <input
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Buscar por nombre, correo, empresa…"
                className="w-64 rounded-lg border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Botón Agregar usuario */}
            <button
              onClick={() => {
                setNewRole("cliente");
                setNewName("");
                setNewEmail("");
                setNewPhone("");
                setNewCompany("");
                setAddError(null);
                setShowAdd(true);
              }}
              className="ml-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-400"
            >
              Agregar usuario
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4">
          <h1 className="text-xl font-bold mb-4">Administrar usuarios</h1>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Rol</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Correo</th>
                  <th className="py-2 pr-4">Teléfono</th>
                  <th className="py-2 pr-4">Empresa</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Cargando…
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Sin resultados
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((u: any) => {
                    const isAdmin = u._roleNorm === "admin";
                    const isCliente = u._roleNorm === "cliente";
                    const estado = u.disabled ? "Bloqueado" : "Activo";
                    return (
                      <tr key={u.uid} className="border-b">
                        <td className="py-2 pr-4 capitalize">{u._roleNorm}</td>
                        <td className="py-2 pr-4">{u.displayName || "—"}</td>
                        <td className="py-2 pr-4">{u.email || "—"}</td>
                        <td className="py-2 pr-4">{u.phone || "—"}</td>
                        <td className="py-2 pr-4">{isAdmin ? u.company || "—" : "—"}</td>
                        <td className="py-2 pr-4">{estado}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-1 rounded-md border border-transparent hover:border-emerald-400 hover:text-emerald-600"
                              onClick={() => openEdit(u)}
                            >
                              Editar
                            </button>
                            <button
                              className="px-3 py-1 rounded-md border border-transparent hover:border-emerald-400 hover:text-emerald-600"
                              onClick={() => doBlockToggle(u)}
                            >
                              {u.disabled ? "Desbloquear" : "Bloquear"}
                            </button>
                            <button
                              className="px-3 py-1 rounded-md border border-transparent hover:border-emerald-400 hover:text-emerald-700"
                              onClick={() => doDelete(u)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Agregar usuario */}
      {showAdd && (
        <Overlay>
          <h2 className="text-lg font-bold mb-3">Agregar usuario</h2>
          {addError && <div className="mb-3 text-sm text-red-600">{addError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Rol</span>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Exclude<Role, null>)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="superadmin">SuperAdmin</option>
                <option value="admin">Admin</option>
                <option value="cliente">Cliente</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Nombre</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Nombre completo"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Correo (requerido si Admin)</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
                placeholder="usuario@correo.com"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Teléfono (requerido si Cliente)</span>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
                placeholder="+57300…"
              />
            </label>

            {newRole === "admin" && (
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-gray-600">Empresa</span>
                <input
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Nombre de la empresa"
                />
              </label>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              disabled={savingAdd}
            >
              Cancelar
            </button>
            <button
              onClick={onCreateUser}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-60"
              disabled={savingAdd}
            >
              {savingAdd ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </Overlay>
      )}

      {/* Modal: Editar usuario */}
      {showEdit && editUser && (
        <Overlay>
          <h2 className="text-lg font-bold mb-3">Editar usuario</h2>
          {editError && <div className="mb-3 text-sm text-red-600">{editError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Rol</span>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Exclude<Role, null>)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="superadmin">SuperAdmin</option>
                <option value="admin">Admin</option>
                <option value="cliente">Cliente</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Nombre</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Nombre completo"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Correo</span>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
                placeholder="usuario@correo.com"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Teléfono</span>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
                placeholder="+57300…"
              />
            </label>

            {editRole === "admin" && (
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-gray-600">Empresa</span>
                <input
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Nombre de la empresa"
                />
              </label>
            )}
          </div>

          <div className="mt-5 flex justify-between gap-3">
            <div className="text-xs text-gray-500 self-center">
              ID: <code>{editUser.uid}</code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEdit(false);
                  setEditUser(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button
                onClick={onSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-60"
                disabled={savingEdit}
              >
                {savingEdit ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
