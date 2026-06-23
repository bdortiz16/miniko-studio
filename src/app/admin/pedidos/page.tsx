"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MiFigure } from "@/components/MiniIcons";

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

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notify, setNotify] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const audioCtx = useRef<AudioContext | null>(null);

  function money(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(
        amount / 100
      );
    } catch {
      return `${(amount / 100).toFixed(2)} ${currency}`;
    }
  }

  // Sonido de aviso (dos tonos) generado en el navegador, sin archivo.
  function playDing() {
    const ctx = audioCtx.current;
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

  function onNewOrders(fresh: Order[]) {
    const n = fresh.length;
    setBanner(`¡${n} pedido${n > 1 ? "s" : ""} nuevo${n > 1 ? "s" : ""}!`);
    playDing();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🎉 Nuevo pedido en Miniko", {
          body: `${fresh[0].email} · ${money(fresh[0].amount, fresh[0].currency)}`,
        });
      }
    } catch {}
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

  // Activa avisos: desbloquea el sonido (gesto del usuario) y pide permiso de
  // notificaciones del navegador.
  async function enableNotify() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx.current = new Ctx();
      if (audioCtx.current.state === "suspended") await audioCtx.current.resume();
    } catch {}
    try {
      if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
    } catch {}
    setNotify(true);
    playDing();
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
          <button
            onClick={enableNotify}
            className={`rounded-full border px-5 py-2 text-sm font-semibold ${
              notify ? "border-green-600 text-green-700" : "border-line text-ink/70 hover:border-ink"
            }`}
          >
            {notify ? "🔔 Avisos activos" : "🔔 Activar avisos"}
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

        {orders && orders.length > 0 && <OrdersDashboard orders={orders} />}

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
                    {o.envio_telefono ? ` · 📱 ${o.envio_telefono}` : ""}
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
          <p className="mt-8 text-sm text-ink/45">Cargando pedidos…</p>
        )}
      </div>
    </div>
  );
}

// Resumen tipo "Estado de envíos": conteos por estado y guía.
function OrdersDashboard({ orders }: { orders: Order[] }) {
  const total = orders.length;
  const by = (k: string) => orders.filter((o) => (o.fulfillment || "RECIBIDO") === k).length;
  const conGuia = orders.filter((o) => o.tracking).length;
  const sinGuia = total - conGuia;

  const cards: { label: string; value: number; color: string }[] = [
    { label: "Pedidos pagados", value: total, color: "text-ink" },
    { label: "Recibidos", value: by("RECIBIDO"), color: "text-ink" },
    { label: "En producción", value: by("EN_PRODUCCION"), color: "text-amber-600" },
    { label: "Enviados", value: by("ENVIADO"), color: "text-blue-600" },
    { label: "Entregados", value: by("ENTREGADO"), color: "text-green-600" },
    { label: "Sin guía", value: sinGuia, color: sinGuia > 0 ? "text-brand" : "text-ink/40" },
  ];

  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-bold">Estado de envíos</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-white p-4">
            <p className={`font-display text-2xl font-extrabold ${c.color}`}>{c.value}</p>
            <p className="mt-0.5 text-xs font-medium text-ink/55">{c.label}</p>
          </div>
        ))}
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

  // Generación de guía con Envia.com (prefill con lo capturado en el checkout).
  const [labelUrl, setLabelUrl] = useState(order.labelUrl || "");
  const [phone, setPhone] = useState(order.envio_telefono || "");
  const [depto, setDepto] = useState(order.envio_departamento || "");
  const [postal, setPostal] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

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
        body: JSON.stringify({ reference: order.id, phone, state: depto, postalCode: postal }),
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
              Verifica los datos del destinatario (vienen del cliente) y genera la guía con Envia.com.
              Esto crea la guía y la etiqueta, marca el pedido como <b>Enviado</b> y avisa al cliente.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-ink/60">
                Teléfono destinatario
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3001234567" className={`mt-1 ${input}`} />
              </label>
              <label className="text-xs font-medium text-ink/60">
                Departamento
                <input value={depto} onChange={(e) => setDepto(e.target.value)} placeholder="Antioquia" className={`mt-1 ${input}`} />
              </label>
              <label className="text-xs font-medium text-ink/60">
                Código postal (opcional)
                <input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="050001" className={`mt-1 ${input}`} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button onClick={generarGuiaYEnviar} disabled={genLoading} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
                {genLoading ? "Generando guía…" : "Generar guía y marcar Enviado"}
              </button>
              <button onClick={() => advance("ENVIADO")} disabled={saving} className="text-xs text-ink/50 underline underline-offset-2 hover:text-ink">
                Marcar enviado sin guía
              </button>
            </div>
            {genError && (
              <p className="mt-2 rounded-lg border border-brand/40 px-3 py-2 text-xs text-brand">{genError}</p>
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
