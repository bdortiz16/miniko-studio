"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MiFigure } from "@/components/MiniIcons";

interface Order {
  id: string;
  numero: string;
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
  envio_telefono: string;
  envio_departamento: string;
  envio_direccion: string;
  fotos: string[];
  figuras_ia: string[];
  fulfillment: string;
  carrier: string;
  tracking: string;
  labelUrl: string;
  adminNote: string;
}

const FULFILLMENT: { key: string; label: string }[] = [
  { key: "RECIBIDO", label: "Pedido recibido" },
  { key: "EN_PRODUCCION", label: "En producción" },
  { key: "ENVIADO", label: "Enviado" },
  { key: "ENTREGADO", label: "Entregado" },
];

// Filtros del tablero (clic en una tarjeta filtra la lista de abajo).
type FilterKey = "ALL" | "RECIBIDO" | "EN_PRODUCCION" | "ENVIADO" | "ENTREGADO" | "SIN_GUIA";

function matchesFilter(o: Order, f: FilterKey): boolean {
  const status = o.fulfillment || "RECIBIDO";
  if (f === "ALL") return true;
  if (f === "SIN_GUIA") return !o.tracking;
  return status === f;
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  function money(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
        amount / 100
      );
    } catch {
      return `${(amount / 100).toFixed(2)} ${currency}`;
    }
  }

  // El asistente global (campana + Funko) hace el sonido y la notificación;
  // aquí solo mostramos un banner visual en la propia página.
  function onNewOrders(fresh: Order[]) {
    const n = fresh.length;
    setBanner(`¡${n} pedido${n > 1 ? "s" : ""} nuevo${n > 1 ? "s" : ""}!`);
    window.setTimeout(() => setBanner(null), 20000);
  }

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar.");
      const list: Order[] = data.orders || [];
      if (!firstLoad.current) {
        const fresh = list.filter((o) => !knownIds.current.has(o.id));
        if (fresh.length > 0) onNewOrders(fresh);
      }
      knownIds.current = new Set(list.map((o) => o.id));
      firstLoad.current = false;
      setOrders(list);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Error de red.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Carga automática al entrar y refresco cada 20s.
  useEffect(() => {
    load();
    const t = window.setInterval(() => load(true), 20000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold">Pedidos</h1>
          <span className="relative inline-grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-brand">
            <MiFigure className={`h-5 w-5 ${banner ? "animate-bounce" : ""}`} />
            {banner && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand" />
            )}
          </span>
        </div>
        <p className="mt-2 text-ink/60">
          Pedidos pagados pendientes de preparar. Aquí ves la foto, el diseño IA
          y los datos de envío de cada cliente.
        </p>
        <div className="mt-4 h-px w-16 bg-brand/70" />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">
            ← Panel
          </Link>
          <button onClick={() => load()} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Cargando…" : "Actualizar"}
          </button>
          {orders && (
            <span className="text-sm text-ink/55">
              {orders.length} pedido(s) · se actualiza solo
            </span>
          )}
        </div>

        {banner && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-green-500/50 bg-green-50 px-4 py-3 text-green-800">
            <MiFigure className="h-6 w-6 animate-bounce" />
            <span className="font-semibold">{banner} Revisa abajo 👇</span>
            <button onClick={() => setBanner(null)} className="ml-auto text-sm underline">
              Cerrar
            </button>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {error}
          </p>
        )}

        {orders && orders.length === 0 && (
          <p className="mt-8 text-ink/55">Aún no hay pedidos pagados.</p>
        )}

        {orders && orders.length > 0 && (
          <OrdersDashboard orders={orders} filter={filter} onFilter={setFilter} />
        )}

        <div className="mt-8 space-y-5">
          {orders?.filter((o) => matchesFilter(o, filter)).length === 0 &&
            orders.length > 0 && (
              <p className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/55">
                No hay pedidos en esta categoría.
              </p>
            )}
          {orders?.filter((o) => matchesFilter(o, filter)).map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">
                    <span className="mr-2 rounded-lg bg-ink px-2 py-0.5 align-middle font-mono text-sm text-white">
                      {o.numero}
                    </span>
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
                {/* Imágenes (clic = ampliar) */}
                <div className="flex gap-2">
                  {o.fotos.map((f, i) => (
                    <button key={i} type="button" onClick={() => setLightbox(f)} className="block cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f}
                        alt={`Foto ${i + 1}`}
                        className="h-24 w-24 rounded-lg border border-line object-cover"
                      />
                    </button>
                  ))}
                  {o.figuras_ia?.map((f, i) => (
                    <button key={`ia${i}`} type="button" onClick={() => setLightbox(f)} className="block cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f}
                        alt={`Diseño IA ${i + 1}`}
                        className="h-24 w-24 rounded-lg border-2 border-brand object-contain"
                      />
                    </button>
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
                    {o.envio_telefono ? ` · 📱 ${o.envio_telefono}` : ""}
                  </p>
                  <p className="mt-1">{o.envio_direccion || "Sin dirección"}</p>
                  <p className="mt-2 text-xs text-ink/40">Pedido {o.numero}</p>
                </div>
              </div>

              {/* Seguimiento (lo ve el cliente en "Mis pedidos") */}
              <Tracking order={o} />
            </div>
          ))}
        </div>

        {!orders && !loading && (
          <p className="mt-8 text-sm text-ink/45">Cargando pedidos…</p>
        )}
      </div>

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// Visor de imagen ampliada con descarga, sin salir de la página.
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  async function download() {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = `miniko-${Date.now()}.${(blob.type.split("/")[1] || "png").replace("jpeg", "jpg")}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(obj);
    } catch {
      window.open(url, "_blank");
    }
  }
  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4">
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Imagen del pedido" className="max-h-[80vh] w-auto rounded-xl bg-white object-contain shadow-2xl" />
        <div className="mt-4 flex gap-3">
          <button onClick={download} className="btn-primary px-5 py-2 text-sm">⬇️ Descargar</button>
          <button onClick={onClose} className="rounded-full border border-white/60 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20">
            Cerrar
          </button>
        </div>
      </div>
      <button onClick={onClose} aria-label="Cerrar" className="absolute right-5 top-4 text-4xl leading-none text-white/80 hover:text-white">
        ×
      </button>
    </div>
  );
}

// Tablero "Estado de envíos": tarjetas que además FILTRAN la lista de abajo.
function OrdersDashboard({
  orders,
  filter,
  onFilter,
}: {
  orders: Order[];
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
}) {
  const total = orders.length;
  const by = (k: string) => orders.filter((o) => (o.fulfillment || "RECIBIDO") === k).length;
  const sinGuia = orders.filter((o) => !o.tracking).length;

  const cards: { key: FilterKey; label: string; value: number; color: string }[] = [
    { key: "ALL", label: "Todos", value: total, color: "text-ink" },
    { key: "RECIBIDO", label: "Pendientes", value: by("RECIBIDO"), color: "text-ink" },
    { key: "EN_PRODUCCION", label: "En producción", value: by("EN_PRODUCCION"), color: "text-amber-600" },
    { key: "ENVIADO", label: "En envío", value: by("ENVIADO"), color: "text-blue-600" },
    { key: "ENTREGADO", label: "Completados", value: by("ENTREGADO"), color: "text-green-600" },
    { key: "SIN_GUIA", label: "Sin guía", value: sinGuia, color: sinGuia > 0 ? "text-brand" : "text-ink/40" },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-bold">Estado de envíos</h2>
        {filter !== "ALL" && (
          <button onClick={() => onFilter("ALL")} className="text-xs font-semibold text-brand underline underline-offset-2">
            Quitar filtro
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onFilter(active ? "ALL" : c.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                active ? "border-ink bg-ink text-white shadow-sm" : "border-line bg-white hover:border-ink/40"
              }`}
            >
              <p className={`font-display text-2xl font-extrabold ${active ? "text-white" : c.color}`}>{c.value}</p>
              <p className={`mt-0.5 text-xs font-medium ${active ? "text-white/80" : "text-ink/55"}`}>{c.label}</p>
            </button>
          );
        })}
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

  // Generación de guía con Envia.com (usa los datos que dio el cliente).
  const [labelUrl, setLabelUrl] = useState(order.labelUrl || "");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Guía manual: cuando se genera por fuera (otra transportadora/contraentrega).
  const [manualOpen, setManualOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const seq = FULFILLMENT.map((f) => f.key);
  const curIdx = Math.max(0, seq.indexOf(fulfillment));

  // Avanza el estado (secuencial). No toca transportadora/guía.
  async function updateState(next: string) {
    const res = await fetch("/api/admin/order-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: order.id, fulfillment: next }),
    });
    if (res.ok) setFulfillment(next);
    return res.ok;
  }

  async function advance(next: string) {
    setSaving(true);
    try {
      await updateState(next);
    } finally {
      setSaving(false);
    }
  }

  // Genera la guía con Envia (datos del cliente) y marca como Enviado.
  async function generarGuiaYEnviar() {
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/generar-guia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar la guía.");
      if (data.carrier) setCarrier(data.carrier);
      if (data.tracking) setTracking(data.tracking);
      if (data.labelUrl) setLabelUrl(data.labelUrl);
      await updateState("ENVIADO");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Error de red.");
    } finally {
      setGenLoading(false);
    }
  }

  // Guarda una guía escrita a mano (transportadora + número) y marca Enviado.
  // El pedido SIEMPRE queda con guía: no se puede enviar sin ella.
  async function guardarGuiaManual() {
    const t = tracking.trim();
    const c = carrier.trim();
    if (!c || !t) {
      setManualError("Escribe la transportadora y el número de guía.");
      return;
    }
    setManualLoading(true);
    setManualError(null);
    try {
      const res = await fetch("/api/admin/order-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.id, carrier: c, tracking: t, fulfillment: "ENVIADO" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la guía.");
      setFulfillment("ENVIADO");
      setManualOpen(false);
    } catch (e) {
      setManualError(e instanceof Error ? e.message : "Error de red.");
    } finally {
      setManualLoading(false);
    }
  }

  async function saveNota() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/order-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.id, adminNote }),
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

  // Abre un sticker 10x15 cm autoimprimible (impresora térmica). Usa los datos
  // actuales del formulario, así puedes pegar la guía y imprimir al instante.
  function printLabel() {
    const esc = (s: string) =>
      String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
    const fecha = new Date(order.created * 1000).toLocaleDateString("es-CO");
    const guia = tracking.trim();
    const transp = carrier.trim();
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Etiqueta ${esc(order.id)}</title>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  * { box-sizing: border-box; }
  html,body { margin:0; padding:0; }
  body { font-family: Arial, Helvetica, sans-serif; color:#111; }
  .label { width:100mm; min-height:150mm; padding:6mm; display:flex; flex-direction:column; gap:3mm; }
  .top { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #111; padding-bottom:2mm; }
  .brand { font-size:24pt; font-weight:800; letter-spacing:-0.5px; }
  .tag { font-size:9pt; font-weight:700; text-transform:uppercase; }
  .sec { font-size:8pt; text-transform:uppercase; letter-spacing:1px; color:#666; }
  .big { font-size:13pt; font-weight:700; line-height:1.25; }
  .addr { font-size:12pt; line-height:1.35; }
  .content { font-size:10pt; }
  .guia-box { margin-top:auto; border:2px solid #111; border-radius:4px; padding:3mm; text-align:center; }
  .guia-num { font-size:22pt; font-weight:800; letter-spacing:1px; }
  .muted { font-size:8pt; color:#888; }
  .row { display:flex; justify-content:space-between; }
</style></head>
<body onload="window.print()">
  <div class="label">
    <div class="top"><span class="brand">miniko<span style="color:#E5322D">.</span></span><span class="tag">Envío</span></div>
    <div>
      <div class="sec">Destinatario</div>
      <div class="big">${esc(order.envio_nombre) || "—"}</div>
      ${order.envio_telefono ? `<div class="addr">📱 ${esc(order.envio_telefono)}</div>` : ""}
      <div class="addr">${esc(order.envio_direccion) || "Sin dirección"}</div>
    </div>
    <div>
      <div class="sec">Contenido</div>
      <div class="content">${esc(order.tipo)} · ${esc(order.estilo)} · ${esc(order.composicion)} · ${esc(order.personas)} personaje(s)</div>
    </div>
    <div class="guia-box">
      <div class="sec">${transp ? esc(transp) : "Transportadora (99Envios)"}</div>
      <div class="guia-num">${guia ? esc(guia) : "—— guía ——"}</div>
      ${guia ? "" : '<div class="muted">Genera la guía en 99Envios y vuelve a imprimir</div>'}
    </div>
    <div class="row"><span class="muted">Pedido: ${esc(order.id)}</span><span class="muted">${fecha}</span></div>
  </div>
  <script>window.onafterprint = function(){ setTimeout(function(){ window.close(); }, 300); };</script>
</body></html>`;
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) {
      alert("Permite las ventanas emergentes para imprimir la etiqueta.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  const shipped = fulfillment === "ENVIADO" || fulfillment === "ENTREGADO";

  return (
    <div className="mt-5 rounded-xl border border-line bg-mist/60 p-4">
      <p className="text-sm font-semibold">📦 Seguimiento del cliente</p>

      {/* Progreso secuencial (no se salta de un paso a otro) */}
      <div className="mt-4 flex items-center">
        {FULFILLMENT.map((f, i) => {
          const done = i <= curIdx;
          return (
            <div key={f.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${
                  done ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/40"
                }`}>
                  {done ? "✓" : i + 1}
                </span>
                <span className={`mt-1 text-center text-[10px] sm:text-xs ${
                  i === curIdx ? "font-bold text-ink" : done ? "text-ink/70" : "text-ink/40"
                }`}>
                  {f.label}
                </span>
              </div>
              {i < FULFILLMENT.length - 1 && (
                <span className={`mx-1 h-0.5 flex-1 ${i < curIdx ? "bg-brand" : "bg-line"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Acción del paso actual */}
      <div className="mt-5">
        {fulfillment === "RECIBIDO" && (
          <button onClick={() => advance("EN_PRODUCCION")} disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
            {saving ? "Guardando…" : "Pasar a producción →"}
          </button>
        )}

        {fulfillment === "EN_PRODUCCION" && (
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-sm font-semibold">🚚 Generar guía y enviar</p>
            <p className="mt-1 text-xs text-ink/55">
              Con los datos que dio el cliente, genera la guía con Envia.com. Esto crea la guía
              y la etiqueta, marca el pedido como <b>Enviado</b> y avisa al cliente.
            </p>
            <div className="mt-3 grid gap-2 rounded-xl border border-line bg-mist/50 p-3 text-sm sm:grid-cols-3">
              <div>
                <span className="text-xs text-ink/50">Destinatario</span>
                <p className="font-medium text-ink">{order.envio_nombre || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-ink/50">Teléfono</span>
                <p className="font-medium text-ink">{order.envio_telefono || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-ink/50">Departamento</span>
                <p className="font-medium text-ink">{order.envio_departamento || "—"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button onClick={generarGuiaYEnviar} disabled={genLoading} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
                {genLoading ? "Generando guía…" : "Generar guía y marcar Enviado"}
              </button>
              <button onClick={() => { setManualOpen((v) => !v); setManualError(null); }} className="text-sm font-semibold text-ink/70 underline underline-offset-2 hover:text-ink">
                Colocar guía manual
              </button>
            </div>
            {genError && (
              <p className="mt-2 rounded-lg border border-brand/40 px-3 py-2 text-xs text-brand">{genError}</p>
            )}

            {/* Guía manual: el pedido se marca Enviado solo con su número de guía. */}
            {manualOpen && (
              <div className="mt-4 rounded-xl border border-line bg-mist/50 p-4">
                <p className="text-sm font-semibold">📝 Guía manual</p>
                <p className="mt-1 text-xs text-ink/55">
                  Si generaste la guía por fuera, escribe la transportadora y el número.
                  El pedido se marcará como <b>Enviado</b> con esa guía y se avisará al cliente.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-ink/60">
                    Transportadora
                    <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Interrapidísimo, Servientrega…" className={`mt-1 ${input}`} />
                  </label>
                  <label className="block text-xs font-medium text-ink/60">
                    Número de guía
                    <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Ej. 990123456789" className={`mt-1 ${input}`} />
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={guardarGuiaManual} disabled={manualLoading} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
                    {manualLoading ? "Guardando…" : "Guardar guía y marcar Enviado"}
                  </button>
                  <button onClick={() => setManualOpen(false)} className="text-xs text-ink/50 underline underline-offset-2 hover:text-ink">
                    Cancelar
                  </button>
                </div>
                {manualError && (
                  <p className="mt-2 rounded-lg border border-brand/40 px-3 py-2 text-xs text-brand">{manualError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {fulfillment === "ENVIADO" && (
          <button onClick={() => advance("ENTREGADO")} disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
            {saving ? "Guardando…" : "Marcar entregado →"}
          </button>
        )}

        {fulfillment === "ENTREGADO" && (
          <p className="text-sm font-semibold text-green-600">✓ Pedido entregado</p>
        )}
      </div>

      {/* Datos de envío: solo cuando ya está enviado */}
      {shipped && (
        <div className="mt-4 rounded-xl border border-line bg-white p-4 text-sm">
          <p className="font-semibold">🚚 Envío</p>
          {carrier && <p className="mt-1 text-ink/70">Transportadora: <b className="text-ink">{carrier}</b></p>}
          {tracking ? (
            <p className="mt-0.5 text-ink/70">Guía: <b className="font-mono text-ink">{tracking}</b></p>
          ) : (
            <p className="mt-1 text-xs text-ink/50">Enviado sin guía generada.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {labelUrl && (
              <a href={labelUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand underline underline-offset-2">
                Ver etiqueta oficial (PDF) ↗
              </a>
            )}
            <button onClick={printLabel} type="button" className="btn-secondary px-4 py-1.5 text-xs">
              🖨️ Imprimir etiqueta
            </button>
          </div>
        </div>
      )}

      {/* Nota para el cliente */}
      <label className="mt-4 block text-xs font-medium text-ink/60">
        Nota para el cliente (opcional)
        <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Tu figura está en producción 🎨" className={`mt-1 ${input}`} />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={saveNota} disabled={saving} className="btn-secondary px-5 py-2 text-sm disabled:opacity-50">
          Guardar nota
        </button>
        {saved && <span className="text-sm font-semibold text-green-600">✓ Guardado</span>}
      </div>
    </div>
  );
}
