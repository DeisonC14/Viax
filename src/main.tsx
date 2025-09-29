// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App";
import Login from "./pages/login";                 // respeta minúsculas si el archivo es login.tsx
import Registro from "./pages/Registro";
import SuperAdmin from "./pages/SuperAdmin";
import Administrar from "./pages/Administrar";
import Bloqueado from "./pages/Bloqueado";

import Admin from "./pages/Admin";
import AdminAgregarRuta from "./pages/AdminAgregarRuta"; // crea esta vista si aún no existe
import AdminRutas from "./pages/AdminRutas";

import { AuthProvider } from "./hooks/useAuth";
import { Protected, RoleGuard } from "./components/RouteGuards";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/bloqueado" element={<Bloqueado />} />

          {/* Solo SUPERADMIN */}
          <Route
            path="/superadmin"
            element={
              <Protected>
                <RoleGuard allow={["superadmin"]}>
                  <SuperAdmin />
                </RoleGuard>
              </Protected>
            }
          />
          <Route
            path="/administrar"
            element={
              <Protected>
                <RoleGuard allow={["superadmin"]}>
                  <Administrar />
                </RoleGuard>
              </Protected>
            }
          />

          {/* ADMIN (y opcionalmente SUPERADMIN también puede ver estas) */}
          <Route
            path="/admin"
            element={
              <Protected>
                <RoleGuard allow={["admin", "superadmin"]}>
                  <Admin />
                </RoleGuard>
              </Protected>
            }
          />
          <Route
            path="/admin/agregar-ruta"
            element={
              <Protected>
                <RoleGuard allow={["admin", "superadmin"]}>
                  <AdminAgregarRuta />
                </RoleGuard>
              </Protected>
            }
          />
          <Route
            path="/admin/rutas"
            element={
              <Protected>
                <RoleGuard allow={["admin", "superadmin"]}>
                  <AdminRutas />
                </RoleGuard>
              </Protected>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
