import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../hooks/useAuth";

type AllowedRole = "cliente" | "admin" | "superadmin";

export function Protected({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RoleGuard({
  allow,
  children,
}: {
  allow: AllowedRole[];
  children: ReactElement;
}) {
  const { role, loading } = useAuth();
  if (loading) return <div className="p-4">Cargando…</div>;

  // role puede ser null: bloquea si no hay rol o si no está permitido
  if (!role || !allow.includes(role as AllowedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
