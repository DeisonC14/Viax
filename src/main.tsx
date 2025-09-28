// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/login"; // asegúrate de que el archivo exista en src/pages/Login.tsx
import Registro from "./pages/Registro"; // asegúrate de que el archivo exista en src/pages/Registro.tsx
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Home / Bienvenida */}
        <Route path="/" element={<App />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />
        {/* Registro */}
        <Route path="/registro" element={<Registro />} />

        {/* Cualquier otra ruta redirige a home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
