"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MiFigure } from "@/components/MiniIcons";
import { getSettings } from "@/lib/settings";

// Asistente del admin: vive en todas las páginas del panel. Revisa pedidos cada
// 25s, avisa de los nuevos (sonido + notificación del navegador) y muestra
// pendientes (sin guía / por producir). Campana arriba + Funko abajo.

interface OrderLite {
  id: string;
  email: string;
  amount: number;
  currency: string;
  fulfillment: string;
  tracking: string;
  estilo: string;
  composicion: string;
}

function money(amount: number, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
  } catch {
    return `$${Math.round(amount / 100).toLocaleString("es-CO")}`;
  }
}

export default function AdminAssistant() {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [bump, setBump] = useState(false);
  const [notify, setNotify] = useState(false);
  const [icon, setIcon] = useState("");

  const known = useRef<Set<string>>(new Set());
  const first = useRef(true);
  const audio = useRef<AudioContext | null>(null);

  function playDing() {
    const ctx = audio.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const start = now + i * 0.18;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      o.start(start);
      o.stop(start + 0.18);
    });
  }

  function onNew(fresh: OrderLite[]) {
    setNewCount((c) => c + fresh.length);
    setBump(true);
    window.setTimeout(() => setBump(false), 5000);
    playDing();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🎉 Nuevo pedido en Miniko", {
          body: `${fresh[0].email} · ${money(fresh[0].amount, fresh[0].currency)}`,
        });
      }
    } catch {}
  }

  async function load() {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return; // sin sesión o sin permiso
      const data = await res.json();
      const list: OrderLite[] = data.orders || [];
      if (!first.current) {
        const fresh = list.filter((o) => !known.current.has(o.id));
        if (fresh.length) onNew(fresh);
      }
      known.current = new Set(list.map((o) => o.id));
      first.current = false;
      setOrders(list);
    } catch {}
  }

  async function enableSound() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio.current = new Ctx();
      if (audio.current.state === "suspended") await audio.current.resume();
    } catch {}
    try {
      if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
    } catch {}
    setNotify(true);
    playDing();
  }

  useEffect(() => {
    load();
    getSettings().then((s) => { if (s.supportIcon) setIcon(s.supportIcon); }).catch(() => {});
    const t = window.setInterval(load, 25000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sinGuia = orders.filter((o) => !o.tracking).length;
  const recibidos = orders.filter((o) => (o.fulfillment || "RECIBIDO") === "RECIBIDO").length;
  const pendientes = sinGuia + recibidos;
  const badge = newCount > 0 ? newCount : pendientes;
  const badgeColor = newCount > 0 ? "bg-brand" : "bg-amber-500";

  function togglePanel() {
    setOpen((v) => !v);
    setNewCount(0);
  }

  return (
    <>
      {/* Campana — arriba a la derecha */}
      <button
        onClick={togglePanel}
        aria-label="Notificaciones"
        className="fixed right-4 top-4 z-[80] grid h-11 w-11 place-items-center rounded-full border border-line bg-white shadow-sm transition hover:scale-105"
      >
        <span className={`text-lg ${bump ? "animate-bounce" : ""}`}>🔔</span>
        {badge > 0 && (
          <span className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white ${badgeColor}`}>
            {badge}
          </span>
        )}
      </button>

      {/* Funko asistente — abajo a la derecha (solo el Funko, sin círculo) */}
      <button
        onClick={togglePanel}
        aria-label="Asistente"
        className="fixed bottom-5 right-5 z-[80] text-brand transition hover:scale-105"
      >
        {icon ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={icon} alt="Asistente" className={`h-24 w-24 object-contain drop-shadow-xl ${bump ? "animate-bounce" : ""}`} />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-brand bg-white">
            <MiFigure className={`h-9 w-9 ${bump ? "animate-bounce" : ""}`} />
          </span>
        )}
        {badge > 0 && (
          <span className={`absolute right-0 top-0 grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-bold text-white ${badgeColor}`}>
            {badge}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[80] w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-line bg-white p-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <MiFigure className="h-6 w-6 text-brand" />
            <p className="font-display font-bold">Asistente Miniko</p>
            <button onClick={() => setOpen(false)} className="ml-auto text-ink/40 hover:text-ink">✕</button>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <Row label="Pedidos por producir" value={recibidos} href="/panel-mk9z3/pedidos" />
            <Row label="Pedidos sin guía" value={sinGuia} href="/panel-mk9z3/pedidos" />
          </div>

          {orders.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-xs font-semibold text-ink/50">Últimos pedidos</p>
              <div className="mt-2 space-y-1.5">
                {orders.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-ink/70">{o.estilo} · {o.composicion}</span>
                    <span className="shrink-0 font-semibold">{money(o.amount, o.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <Link href="/panel-mk9z3/pedidos" className="btn-primary flex-1 px-3 py-2 text-center text-xs">
              Ver pedidos
            </Link>
            {!notify && (
              <button onClick={enableSound} className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink/70 hover:border-ink">
                🔔 Activar avisos
              </button>
            )}
          </div>
          {notify && <p className="mt-2 text-center text-[11px] text-green-600">✓ Avisos activos (deja el panel abierto)</p>}
        </div>
      )}
    </>
  );
}

function Row({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-mist">
      <span className="text-ink/70">{label}</span>
      <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${value > 0 ? "bg-amber-100 text-amber-700" : "bg-mist text-ink/40"}`}>
        {value}
      </span>
    </Link>
  );
}
