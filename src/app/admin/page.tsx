"use client";

import { useEffect, useState, ComponentType } from "react";
import Link from "next/link";
import {
  MiMoney, MiChart, MiBox, MiPeople, MiReceipt, MiTag, MiGear,
} from "@/components/MiniIcons";

type IconType = ComponentType<{ className?: string }>;

interface Recent {
  id: string;
  created: number;
  email: string;
  amount: number;
  currency: string;
  tipo: string;
  estilo: string;
  composicion: string;
}
interface Stats {
  configured: boolean;
  currency?: string;
  revenue?: number;
  revenue30?: number;
  orders?: number;
  customers?: number;
  avgOrder?: number;
  byStyle?: Record<string, number>;
  byTipo?: Record<string, number>;
  daily?: { label: string; amount: number }[];
  recent?: Recent[];
  error?: string;
}

function money(amount: number, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  } catch {
    return `$${Math.round(amount / 100).toLocaleString("es-CO")}`;
  }
}

type Period = "dia" | "semana" | "mes" | "ano";
const PERIODS: { key: Period; label: string }[] = [
  { key: "dia", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "ano", label: "Año" },
];
const MES_LBL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<{ created: number; amount: number }[]>([]);
  const [period, setPeriod] = useState<Period>("mes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar.");
        setStats(data);
        const o = await fetch("/api/admin/orders").then((r) => r.json()).catch(() => ({}));
        setOrders(o.orders || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de red.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cur = stats?.currency || "COP";

  // Gráfica filtrable por período (a partir de los pedidos pagados).
  const chart = (() => {
    const now = new Date();
    const inP = (ts: number) => {
      const d = new Date(ts * 1000);
      if (period === "dia") return d.toDateString() === now.toDateString();
      if (period === "semana") return (now.getTime() - d.getTime()) / 86400000 <= 7;
      if (period === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    };
    const map = new Map<string, number>();
    let total = 0;
    for (const o of orders) {
      if (!inP(o.created)) continue;
      const d = new Date(o.created * 1000);
      const key = period === "ano" ? MES_LBL[d.getMonth()] : `${d.getDate()}/${d.getMonth() + 1}`;
      map.set(key, (map.get(key) || 0) + o.amount / 100);
      total += o.amount / 100;
    }
    const entries = Array.from(map.entries());
    return { entries, max: Math.max(1, ...entries.map((e) => e[1])), total };
  })();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-ink/60">Resumen y gestión de tu tienda.</p>
        </div>
        <div className="mt-4 h-px w-16 bg-brand/70 sm:hidden" />
      </div>

      {loading && (
        <p className="mt-8 flex items-center gap-2 text-sm text-ink/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          Cargando métricas…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>
      )}

      {stats && !stats.configured && (
        <div className="mt-6 rounded-2xl border border-brand/40 bg-white p-6">
          <p className="font-semibold">Configura los pagos para ver tus métricas</p>
          <p className="mt-1 text-sm text-ink/60">
            Añade tus llaves de <b>Wompi</b> y <b>Supabase</b> en Vercel y vuelve a desplegar. Aquí
            verás ingresos, pedidos y clientes en tiempo real.
          </p>
        </div>
      )}

      {stats?.configured && (
        <>
          {/* KPIs */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Ingresos totales" value={money(stats.revenue || 0, cur)} Icon={MiMoney} tone="green" />
            <Kpi label="Últimos 30 días" value={money(stats.revenue30 || 0, cur)} Icon={MiChart} tone="blue" />
            <Kpi label="Pedidos" value={String(stats.orders || 0)} Icon={MiBox} tone="brand" />
            <Kpi label="Clientes" value={String(stats.customers || 0)} Icon={MiPeople} tone="amber" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Ticket promedio" value={money(stats.avgOrder || 0, cur)} Icon={MiReceipt} tone="ink" />
          </div>

          {/* Gráfico de ingresos con filtro de período */}
          <section className="mt-8 rounded-2xl border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Ingresos del período</h2>
                <p className="mt-0.5 text-sm text-ink/55">Total: <b className="text-ink">{money(chart.total * 100, cur)}</b></p>
              </div>
              <div className="inline-flex rounded-full border border-line bg-white p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${period === p.key ? "bg-ink text-white" : "text-ink/60"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {chart.entries.length === 0 ? (
              <p className="mt-4 text-sm text-ink/50">Sin ventas en este período.</p>
            ) : (
              <div className="mt-6 flex items-end gap-1.5" style={{ height: 150 }}>
                {chart.entries.map(([label, val], i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t bg-brand/80 transition-all" style={{ height: `${(val / chart.max) * 100}%`, minHeight: 4 }} title={money(val * 100, cur)} />
                    </div>
                    <span className="text-[9px] text-ink/40">{label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-right">
              <Link href="/admin/contabilidad" className="text-sm font-semibold text-brand underline underline-offset-2">
                Ver contabilidad y utilidad real →
              </Link>
            </div>
          </section>

          {/* Desgloses */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Breakdown title="Por estilo" data={stats.byStyle || {}} total={stats.orders || 0} />
            <Breakdown title="Persona / Mascota" data={stats.byTipo || {}} total={stats.orders || 0} />
          </div>

          {/* Últimos pedidos */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Últimos pedidos</h2>
              <Link href="/admin/pedidos" className="text-sm font-semibold text-brand underline underline-offset-2">
                Ver todos →
              </Link>
            </div>
            {stats.recent && stats.recent.length > 0 ? (
              <div className="mt-4 divide-y divide-line">
                {stats.recent.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {o.tipo?.includes("Mascota") && <span className="mr-1">🐾</span>}
                        {o.estilo || "—"} · {o.composicion || "—"}
                      </p>
                      <p className="truncate text-xs text-ink/50">
                        {o.email || "—"} · {new Date(o.created * 1000).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold">{money(o.amount, o.currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/50">Aún no hay pedidos pagados.</p>
            )}
          </section>
        </>
      )}

      {/* Accesos rápidos */}
      <h2 className="mt-10 font-display text-lg font-bold">Gestión</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/pedidos" Icon={MiBox} title="Pedidos" desc="Foto, diseño IA y envío." />
        <QuickLink href="/admin/clientes" Icon={MiPeople} title="Clientes" desc="Agrupados por correo." />
        <QuickLink href="/admin/precios" Icon={MiTag} title="Precios y envío" desc="Precios COP y envío." />
        <QuickLink href="/admin/configuracion" Icon={MiGear} title="Configuración" desc="WhatsApp, estilos y avisos." />
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  brand: "bg-brand/10 text-brand",
  amber: "bg-amber-50 text-amber-600",
  ink: "bg-mist text-ink",
};

function Kpi({ label, value, Icon, tone = "ink" }: { label: string; value: string; Icon: IconType; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 transition hover:shadow-sm">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${TONES[tone] || TONES.ink}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</p>
    </div>
  );
}

function Breakdown({
  title,
  data,
  total,
}: {
  title: string;
  data: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">Sin datos todavía.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(([k, v]) => {
            const pct = total ? Math.round((v / total) * 100) : 0;
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{k}</span>
                  <span className="text-ink/55">
                    {v} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-mist">
                  <div className="h-full rounded-full bg-brand/80" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QuickLink({
  href,
  Icon,
  title,
  desc,
}: {
  href: string;
  Icon: IconType;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-sm"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-ink transition group-hover:bg-brand/10 group-hover:text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display font-bold">{title}</h3>
      <p className="mt-0.5 text-xs text-ink/55">{desc}</p>
    </Link>
  );
}
