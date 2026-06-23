"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refuerzo de seguridad: cada PESTAÑA debe haber iniciado sesión. Usamos
// sessionStorage (se borra al cerrar la pestaña, sobrevive a recargas y a la
// navegación dentro de la misma pestaña). Si una pestaña nueva entra al panel
// sin esa marca, cerramos la sesión y mandamos al login (pide clave + código).
export const PANEL_SESSION_KEY = "mk_panel_active";

export default function AdminSessionGate() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PANEL_SESSION_KEY) === "1") return;
    } catch {
      return; // sin sessionStorage, no forzamos (no romper el panel)
    }
    // Pestaña nueva / reabierta: cerrar sesión y exigir login.
    fetch("/api/admin/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => router.replace("/panel-mk9z3/login"));
  }, [router]);
  return null;
}
