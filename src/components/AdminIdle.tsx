"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Cierra la sesión del panel tras 2 horas SIN actividad real del usuario.
// La actividad (mouse/teclado/scroll) renueva la sesión en el servidor mediante
// un heartbeat moderado; el sondeo de fondo (avisos) no cuenta como actividad.
const IDLE_MS = 2 * 60 * 60 * 1000; // 2 horas
const HEARTBEAT_EVERY_MS = 5 * 60 * 1000; // refresca como mucho cada 5 min

export default function AdminIdle() {
  const router = useRouter();
  const lastActivity = useRef(Date.now());
  const lastBeat = useRef(0);

  useEffect(() => {
    function onActivity() {
      lastActivity.current = Date.now();
      const now = Date.now();
      if (now - lastBeat.current > HEARTBEAT_EVERY_MS) {
        lastBeat.current = now;
        fetch("/api/admin/heartbeat", { method: "POST" }).catch(() => {});
      }
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current > IDLE_MS) {
        fetch("/api/admin/logout", { method: "POST" })
          .catch(() => {})
          .finally(() => router.replace("/admin/login"));
      }
    }, 30 * 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(timer);
    };
  }, [router]);

  return null;
}
