"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { orderEconomics, Costs } from "@/lib/accounting";
import type { WalletMovement } from "@/lib/wallet";

interface Order {
  id: string;
  created: number;
  amount: number;
  currency: string;
  estilo: string;
  styleId: string;
  personasNum: number;
  mascotasNum: number;
}

type Period = "dia" | "semana" | "mes" | "ano";
const PERIODS: { key: Period; label: string }[] = [
  { key: "dia", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "ano", label: "Año" },
];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function cop(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

export default function AdminContabilidad() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [period, setPeriod] = useState<Period>("mes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Billetera (movimientos manuales).
  const [movements, setMovements] = useState<WalletMovement[]>([]);
  const [mvType, setMvType] = useState<"egreso" | "ingreso">("egreso");
  const [mvConcept, setMvConcept] = useState("");
  const [mvAmount, setMvAmount] = useState("");
  const [mvSaving, setMvSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, s, w] = await Promise.all([
          fetch("/api/admin/orders").then((r) => r.json()),
          fetch("/api/admin/settings").then((r) => r.json()),
          fetch("/api/admin/wallet").then((r) => r.json()),
        ]);
        setOrders(o.orders || []);
        setSettings(s.settings);
        setMovements(w.movements || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const costs = settings?.costs;

  // Filtro por período (sobre la fecha de pago).
  const filtered = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const d = new Date(o.created * 1000);
      if (period === "dia") return d.toDateString() === now.toDateString();
      if (period === "semana") {
        const diff = (now.getTime() - d.getTime()) / 86400000;
        return diff <= 7;
      }
      if (period === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }, [orders, period]);

  // Totales.
  const totals = useMemo(() => {
    const t = { revenue: 0, production: 0, materials: 0, shipping: 0, wompiFee: 0, profit: 0, net: 0 };
    if (!costs) return t;
    for (const o of filtered) {
      const e = orderEconomics({ amount: o.amount, styleId: o.styleId, personas: o.personasNum, mascotas: o.mascotasNum }, costs);
      t.revenue += e.revenue; t.production += e.production; t.materials += e.materials;
      t.shipping += e.shipping; t.wompiFee += e.wompiFee; t.profit += e.profit; t.net += e.net;
    }
    return t;
  }, [filtered, costs]);

  // Gráfica: agrupa por mes (año) o por día.
  const chart = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filtered) {
      const d = new Date(o.created * 1000);
      const key = period === "ano" ? MESES[d.getMonth()] : `${d.getDate()}/${d.getMonth() + 1}`;
      map.set(key, (map.get(key) || 0) + o.amount / 100);
    }
    const entries = Array.from(map.entries());
    const max = Math.max(1, ...entries.map((e) => e[1]));
    return { entries, max };
  }, [filtered, period]);

  // Billetera: neto que entra por TODAS las ventas (no filtrado) − egresos.
  const allTimeNet = useMemo(() => {
    if (!costs) return 0;
    return orders.reduce(
      (s, o) => s + orderEconomics({ amount: o.amount, styleId: o.styleId, personas: o.personasNum, mascotas: o.mascotasNum }, costs).net,
      0
    );
  }, [orders, costs]);
  const egresos = movements.filter((m) => m.type === "egreso").reduce((s, m) => s + m.amount, 0);
  const ingresosManuales = movements.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const saldo = allTimeNet + ingresosManuales - egresos;

  async function addMovement() {
    const amount = Number(mvAmount.replace(/[^\d]/g, ""));
    if (!amount) return;
    setMvSaving(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mvType, concept: mvConcept, amount }),
      });
      const data = await res.json();
      if (res.ok && data.movement) {
        setMovements((m) => [data.movement, ...m]);
        setMvConcept("");
        setMvAmount("");
      }
    } finally {
      setMvSaving(false);
    }
  }
  async function delMovement(id: string) {
    await fetch(`/api/admin/wallet?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMovements((m) => m.filter((x) => x.id !== id));
  }

  async function saveCosts() {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setSettings(data.settings);
      setMsg("✓ Costos guardados.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error.");
    } finally {
      setSaving(false);
    }
  }

  function setCost<K extends keyof Costs>(key: K, value: number) {
    if (!settings) return;
    setSettings({ ...settings, costs: { ...settings.costs, [key]: value } });
  }
  function setProd(styleId: string, tipo: "persona" | "mascota", value: number) {
    if (!settings) return;
    const production = { ...settings.costs.production };
    production[styleId] = { ...production[styleId], [tipo]: value };
    setSettings({ ...settings, costs: { ...settings.costs, production } });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-extrabold">Contabilidad</h1>
        <p className="mt-6 text-sm text-ink/55">Cargando…</p>
      </div>
    );
  }

  const cards = [
    { label: "Ventas", value: cop(totals.revenue), color: "text-ink" },
    { label: "Comisión Wompi", value: cop(totals.wompiFee), color: "text-amber-600" },
    { label: "Costos (prod + materiales + envío)", value: cop(totals.production + totals.materials + totals.shipping), color: "text-amber-600" },
    { label: "Utilidad neta", value: cop(totals.profit), color: totals.profit >= 0 ? "text-green-600" : "text-brand" },
    { label: "Neto en Wompi (billetera)", value: cop(totals.net), color: "text-blue-600" },
  ];

  const styleNames: Record<string, string> = { kawaii: "Clásico", caricatura: "Animado", realista: "Realista" };
  const STYLE_IDS = ["kawaii", "caricatura", "realista"];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Contabilidad</h1>
      <p className="mt-2 text-ink/60">Ventas, costos reales y utilidad. Configura tus costos abajo.</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6 flex items-center gap-2">
        <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
        <div className="ml-auto inline-flex rounded-full border border-line bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${period === p.key ? "bg-ink text-white" : "text-ink/60"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-white p-4">
            <p className={`font-display text-xl font-extrabold ${c.color}`}>{c.value}</p>
            <p className="mt-0.5 text-xs font-medium text-ink/55">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Gráfica */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">Ventas del período</h2>
        {chart.entries.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">Sin ventas en este período.</p>
        ) : (
          <div className="mt-6 flex items-end gap-1.5" style={{ height: 160 }}>
            {chart.entries.map(([label, val], i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t bg-brand/80" style={{ height: `${(val / chart.max) * 100}%`, minHeight: 4 }} title={cop(val)} />
                </div>
                <span className="text-[9px] text-ink/40">{label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Movimientos */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">Movimientos</h2>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">Sin movimientos en este período.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-ink/45">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Pedido</th>
                  <th className="py-2 pr-3 text-right">Venta</th>
                  <th className="py-2 pr-3 text-right">Costo</th>
                  <th className="py-2 pr-3 text-right">Wompi</th>
                  <th className="py-2 text-right">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const e = orderEconomics({ amount: o.amount, styleId: o.styleId, personas: o.personasNum, mascotas: o.mascotasNum }, costs!);
                  return (
                    <tr key={o.id} className="border-b border-line/60">
                      <td className="py-2 pr-3 text-ink/60">{new Date(o.created * 1000).toLocaleDateString("es-CO")}</td>
                      <td className="py-2 pr-3">{o.estilo} · {o.personasNum + o.mascotasNum} fig.</td>
                      <td className="py-2 pr-3 text-right">{cop(e.revenue)}</td>
                      <td className="py-2 pr-3 text-right text-ink/60">{cop(e.production + e.materials + e.shipping)}</td>
                      <td className="py-2 pr-3 text-right text-ink/60">{cop(e.wompiFee)}</td>
                      <td className={`py-2 text-right font-semibold ${e.profit >= 0 ? "text-green-600" : "text-brand"}`}>{cop(e.profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Billetera Wompi */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">💼 Billetera Wompi</h2>
        <p className="mt-1 text-sm text-ink/55">
          Saldo estimado = lo neto que entra por ventas (todas) menos los egresos que registres
          (retiros, compras de material, etc.).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <p className="font-display text-2xl font-extrabold text-blue-700">{cop(saldo)}</p>
            <p className="mt-0.5 text-xs font-medium text-ink/55">Saldo estimado en Wompi</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="font-display text-xl font-extrabold text-green-600">{cop(allTimeNet + ingresosManuales)}</p>
            <p className="mt-0.5 text-xs font-medium text-ink/55">Total entradas (ventas netas + manual)</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="font-display text-xl font-extrabold text-brand">{cop(egresos)}</p>
            <p className="mt-0.5 text-xs font-medium text-ink/55">Total egresos</p>
          </div>
        </div>

        {/* Form para registrar movimiento */}
        <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr_auto_auto]">
          <select value={mvType} onChange={(e) => setMvType(e.target.value as "egreso" | "ingreso")} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <option value="egreso">Egreso</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <input value={mvConcept} onChange={(e) => setMvConcept(e.target.value)} placeholder="Concepto (ej: retiro, compra de cajas)" className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink" />
          <input value={mvAmount} onChange={(e) => setMvAmount(e.target.value)} inputMode="numeric" placeholder="Monto" className="w-32 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink" />
          <button onClick={addMovement} disabled={mvSaving || !mvAmount} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">Registrar</button>
        </div>

        {movements.length > 0 && (
          <div className="mt-4 divide-y divide-line">
            {movements.slice(0, 30).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-bold ${m.type === "egreso" ? "bg-brand/10 text-brand" : "bg-green-100 text-green-700"}`}>
                    {m.type === "egreso" ? "−" : "+"}
                  </span>
                  <span className="text-ink/70">{m.concept || "(sin concepto)"}</span>
                  <span className="ml-2 text-xs text-ink/40">{new Date(m.date * 1000).toLocaleDateString("es-CO")}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`font-semibold ${m.type === "egreso" ? "text-brand" : "text-green-600"}`}>{m.type === "egreso" ? "−" : "+"}{cop(m.amount)}</span>
                  <button onClick={() => delMovement(m.id)} className="text-ink/40 hover:text-brand" aria-label="Eliminar">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editor de costos */}
      {settings && (
        <section className="mt-6 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-lg font-bold">Costos</h2>
          <p className="mt-1 text-sm text-ink/55">En pesos (COP). Con esto se calcula tu utilidad real.</p>

          <h3 className="mt-5 text-sm font-bold">Producción por figura (según estilo y tipo)</h3>
          <div className="mt-3 space-y-3">
            {STYLE_IDS.map((sid) => (
              <div key={sid} className="grid grid-cols-3 items-center gap-3">
                <span className="text-sm font-medium">{styleNames[sid]}</span>
                <CostInput label="Persona" value={settings.costs.production[sid]?.persona ?? 0} onChange={(v) => setProd(sid, "persona", v)} />
                <CostInput label="Mascota" value={settings.costs.production[sid]?.mascota ?? 0} onChange={(v) => setProd(sid, "mascota", v)} />
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-sm font-bold">Materiales por figura</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CostInput label="Pinturas" value={settings.costs.paints} onChange={(v) => setCost("paints", v)} />
            <CostInput label="Pincel" value={settings.costs.brush} onChange={(v) => setCost("brush", v)} />
            <CostInput label="Papel protector" value={settings.costs.paper} onChange={(v) => setCost("paper", v)} />
          </div>

          <h3 className="mt-6 text-sm font-bold">Materiales por pedido</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <CostInput label="Caja" value={settings.costs.box} onChange={(v) => setCost("box", v)} />
            <CostInput label="Envoltura" value={settings.costs.wrapping} onChange={(v) => setCost("wrapping", v)} />
            <CostInput label="Tarjetas" value={settings.costs.cards} onChange={(v) => setCost("cards", v)} />
            <CostInput label="Envío (Envia)" value={settings.costs.shippingCost} onChange={(v) => setCost("shippingCost", v)} />
          </div>

          <h3 className="mt-6 text-sm font-bold">Pasarela e impuestos</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CostInput label="Wompi % (0.0265 = 2.65%)" value={settings.costs.wompiPct} onChange={(v) => setCost("wompiPct", v)} step="0.0001" />
            <CostInput label="Wompi fijo ($)" value={settings.costs.wompiFixed} onChange={(v) => setCost("wompiFixed", v)} />
            <CostInput label="IVA (0.19 = 19%)" value={settings.costs.ivaRate} onChange={(v) => setCost("ivaRate", v)} step="0.01" />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={saveCosts} disabled={saving} className="btn-primary px-8 disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar costos"}
            </button>
            {msg && <span className="text-sm font-semibold text-green-600">{msg}</span>}
          </div>
        </section>
      )}
    </div>
  );
}

function CostInput({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <label className="block text-xs font-medium text-ink/60">
      {label}
      <input
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
        className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
