"use client";

import { useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  created: number;
  email: string;
  amount: number;
  currency: string;
  tipo: string;
  composicion: string;
  estilo: string;
  tamano: string;
  personas: string;
  envio_nombre: string;
  envio_direccion: string;
  fotos: string[];
  figuras_ia: string[];
  fulfillment: string;
  carrier: string;
  tracking: string;
  adminNote: string;
}

const FULFILLMENT: { key: string; label: string }[] = [
  { key: "RECIBIDO", label: "Pedido recibido" },
  { key: "EN_PRODUCCION", label: "En producción" },
  { key: "ENVIADO", label: "Enviado" },
  { key: "ENTREGADO", label: "Entregado" },
];

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar.");
      setOrders(data.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  function money(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
        amount / 100
      );
    } catch {
      return `${(amount / 100).toFixed(2)} ${currency}`;
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-extrabold">Pedidos</h1>
        <p className="mt-2 text-ink/60">
          Pedidos pagados pendientes de preparar. Aquí ves la foto, el diseño IA
          y los datos de envío de cada cliente.
        </p>
        <div className="mt-4 h-px w-16 bg-brand/70" />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">
            ← Panel
          </Link>
          <button onClick={load} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Cargando…" : orders ? "Actualizar" : "Cargar pedidos"}
          </button>
          {orders && (
            <span className="text-sm text-ink/55">{orders.length} pedido(s)</span>
          )}
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {error}
          </p>
        )}

        {orders && orders.length === 0 && (
          <p className="mt-8 text-ink/55">Aún no hay pedidos pagados.</p>
        )}

        <div className="mt-8 space-y-5">
          {orders?.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">
                    {o.tipo && (
                      <span
                        className={`mr-2 rounded-full border px-2 py-0.5 align-middle text-xs font-bold ${
                          o.tipo.includes("Mascota")
                            ? "border-brand text-brand"
                            : "border-line text-ink/60"
                        }`}
                      >
                        {o.tipo.includes("Mascota") ? `🐾 ${o.tipo}` : o.tipo}
                      </span>
                    )}
                    {o.estilo || "—"} · {o.composicion || o.tamano || "—"}
                  </p>
                  <p className="text-sm text-ink/60">
                    {o.email} · {new Date(o.created * 1000).toLocaleString("es-CO")}
                  </p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-sm font-semibold">
                  {money(o.amount, o.currency)}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                {/* Imágenes */}
                <div className="flex gap-2">
                  {o.fotos.map((f, i) => (
                    <a key={i} href={f} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f}
                        alt={`Foto ${i + 1}`}
                        className="h-24 w-24 rounded-lg border border-line object-cover"
                      />
                    </a>
                  ))}
                  {o.figuras_ia?.map((f, i) => (
                    <a key={`ia${i}`} href={f} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f}
                        alt={`Diseño IA ${i + 1}`}
                        className="h-24 w-24 rounded-lg border-2 border-brand object-contain"
                      />
                    </a>
                  ))}
                </div>

                {/* Envío */}
                <div className="text-sm text-ink/70">
                  <p>
                    <span className="font-semibold text-ink">Personajes:</span>{" "}
                    {o.personas || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-ink">Enviar a:</span>{" "}
                    {o.envio_nombre || "—"}
                  </p>
                  <p className="mt-1">{o.envio_direccion || "Sin dirección"}</p>
                  <p className="mt-2 text-xs text-ink/40">ID: {o.id}</p>
                </div>
              </div>

              {/* Seguimiento (lo ve el cliente en "Mis pedidos") */}
              <Tracking order={o} />
            </div>
          ))}
        </div>

        {!orders && !loading && (
          <p className="mt-8 text-sm text-ink/45">
            Pulsa &quot;Cargar pedidos&quot; para ver los pedidos pagados.
          </p>
        )}
      </div>
    </div>
  );
}

// Editor de seguimiento: estado, transportadora, guía y nota. Se guarda en el
// pedido y el cliente lo ve en "Mis pedidos".
function Tracking({ order }: { order: Order }) {
  const [fulfillment, setFulfillment] = useState(order.fulfillment || "RECIBIDO");
  const [carrier, setCarrier] = useState(order.carrier || "");
  const [tracking, setTracking] = useState(order.tracking || "");
  const [adminNote, setAdminNote] = useState(order.adminNote || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/order-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.id, fulfillment, carrier, tracking, adminNote }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <div className="mt-5 rounded-xl border border-line bg-mist/60 p-4">
      <p className="text-sm font-semibold">📦 Seguimiento del cliente</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-ink/60">
          Estado
          <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} className={`mt-1 ${input}`}>
            {FULFILLMENT.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-ink/60">
          Transportadora
          <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Servientrega…" className={`mt-1 ${input}`} />
        </label>
        <label className="text-xs font-medium text-ink/60">
          Número de guía
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="123456789" className={`mt-1 ${input}`} />
        </label>
      </div>
      <label className="mt-3 block text-xs font-medium text-ink/60">
        Nota para el cliente (opcional)
        <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Tu figura está en producción 🎨" className={`mt-1 ${input}`} />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar seguimiento"}
        </button>
        {saved && <span className="text-sm font-semibold text-green-600">✓ Guardado</span>}
      </div>
    </div>
  );
}
