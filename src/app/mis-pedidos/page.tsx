"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Order {
  reference: string;
  createdAt: number;
  amount: number;
  currency: string;
  estilo: string;
  tipo: string;
  composicion: string;
  previewUrl: string;
  photoUrls: string[];
  shipping: { name?: string; address?: string; city?: string; zip?: string; country?: string };
  fulfillment: string;
  fulfillmentLabel: string;
  carrier: string;
  tracking: string;
  adminNote: string;
}

const STEPS: { key: string; label: string }[] = [
  { key: "RECIBIDO", label: "Recibido" },
  { key: "EN_PRODUCCION", label: "En producción" },
  { key: "ENVIADO", label: "Enviado" },
  { key: "ENTREGADO", label: "Entregado" },
];

function money(amount: number, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
  } catch {
    return `$${Math.round(amount / 100).toLocaleString("es-CO")}`;
  }
}

export default function MisPedidosPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mis-pedidos");
      if (res.ok) {
        const data = await res.json();
        setAuthed(true);
        setEmail(data.email);
        setOrders(data.orders || []);
      } else {
        setAuthed(false);
      }
    } catch {
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/mis-pedidos/logout", { method: "POST" });
    setAuthed(false);
    setOrders([]);
  }

  if (loading) {
    return (
      <div className="section">
        <div className="container-x flex items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-x max-w-3xl">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Mis pedidos</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
          <p className="mx-auto mt-4 max-w-md text-ink/60">
            {authed
              ? "Aquí está el estado y el seguimiento de tus pedidos."
              : "Ingresa con el mismo correo que usaste al hacer tu pedido."}
          </p>
        </header>

        {!authed ? (
          <Login onDone={load} />
        ) : (
          <div className="mt-10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">
                Sesión: <span className="font-semibold text-ink">{email}</span>
              </span>
              <button onClick={logout} className="font-semibold text-ink/60 underline underline-offset-2 hover:text-ink">
                Cerrar sesión
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-line bg-white p-8 text-center">
                <p className="text-4xl">📭</p>
                <p className="mt-3 font-semibold">No encontramos pedidos con este correo</p>
                <p className="mt-1 text-sm text-ink/55">
                  Asegúrate de usar el mismo correo del pedido. Si acabas de pagar, puede tardar
                  unos minutos en aparecer.
                </p>
                <Link href="/pedido" className="btn-primary mt-6">Crear mi figura →</Link>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {orders.map((o) => (
                  <OrderCard key={o.reference} order={o} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order: o }: { order: Order }) {
  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.key === o.fulfillment));
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex items-center gap-4">
          {o.previewUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">
              <Image src={o.previewUrl} alt="Figura" fill sizes="64px" className="object-contain" unoptimized={o.previewUrl.startsWith("data:")} />
            </div>
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-line bg-mist text-2xl">🧩</div>
          )}
          <div>
            <p className="font-display text-lg font-bold">
              {o.tipo?.includes("Mascota") && <span className="mr-1">🐾</span>}
              {o.estilo} · {o.composicion}
            </p>
            <p className="text-xs text-ink/50">
              Pedido {o.reference.replace("miniko-", "#")} · {new Date(o.createdAt * 1000).toLocaleDateString("es-CO")}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-sm font-semibold">
          {money(o.amount, o.currency)}
        </span>
      </div>

      {/* Línea de estado */}
      <div className="p-5">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <div key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${
                    done ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/40"
                  }`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`mt-1.5 text-[10px] sm:text-xs ${done ? "font-semibold text-ink" : "text-ink/40"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`mx-1 h-0.5 flex-1 ${i < currentIdx ? "bg-brand" : "bg-line"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Guía / transportadora */}
        {(o.tracking || o.carrier) && (
          <div className="mt-5 rounded-xl border border-line bg-mist p-4 text-sm">
            <p className="font-semibold text-ink">🚚 Envío</p>
            {o.carrier && <p className="mt-1 text-ink/70">Transportadora: <span className="font-medium text-ink">{o.carrier}</span></p>}
            {o.tracking && <p className="mt-0.5 text-ink/70">Guía: <span className="font-mono font-medium text-ink">{o.tracking}</span></p>}
          </div>
        )}

        {o.adminNote && (
          <p className="mt-4 rounded-xl border border-brand/30 bg-white px-4 py-3 text-sm text-ink/75">
            💬 {o.adminNote}
          </p>
        )}

        {/* Detalles de envío */}
        {o.shipping?.name && (
          <p className="mt-4 text-xs text-ink/50">
            <span className="font-semibold text-ink/70">Enviar a:</span> {o.shipping.name},{" "}
            {[o.shipping.address, o.shipping.city, o.shipping.zip, o.shipping.country].filter(Boolean).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [exp, setExp] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el código.");
      setToken(data.token);
      setExp(data.exp);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar el código.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mis-pedidos/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, exp, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código incorrecto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-6">
      <label className="text-sm font-medium">Correo del pedido</label>
      <div className="mt-1.5 flex gap-2">
        <input
          type="email"
          value={email}
          disabled={sent}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-full border border-line px-4 py-2.5 outline-none focus:border-ink"
        />
        {!sent && (
          <button onClick={sendCode} disabled={loading || !email} className="btn-secondary shrink-0 px-5 py-2.5 text-sm disabled:opacity-40">
            Enviar código
          </button>
        )}
      </div>

      {sent && (
        <div className="mt-5">
          <label className="text-sm font-medium">Código de 6 dígitos</label>
          <div className="mt-1.5 flex gap-2">
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full rounded-full border border-line px-4 py-2.5 tracking-[0.5em] outline-none focus:border-ink"
            />
            <button onClick={verify} disabled={loading || code.length !== 6} className="btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-40">
              Entrar
            </button>
          </div>
          <button onClick={sendCode} disabled={loading} className="mt-2 text-xs text-ink/50 underline underline-offset-2">
            Reenviar código
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>
      )}
    </div>
  );
}
