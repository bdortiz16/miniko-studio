"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Customer {
  email: string;
  name: string;
  orders: number;
  totalSpent: number;
  currency: string;
  lastOrder: number;
  lastAddress: string;
}

export default function AdminClientes() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar.");
      setCustomers(data.customers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  // Carga automática al entrar.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function money(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount / 100);
    } catch {
      return `${(amount / 100).toFixed(0)} ${currency}`;
    }
  }

  const filtered = customers?.filter((c) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return c.email.includes(t) || c.name.toLowerCase().includes(t);
  });

  const cur0 = customers?.[0]?.currency || "COP";
  const totalIngresos = customers?.reduce((s, c) => s + c.totalSpent, 0) || 0;
  const totalPedidos = customers?.reduce((s, c) => s + c.orders, 0) || 0;
  const initials = (name: string, email: string) =>
    (name || email || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-extrabold">Clientes</h1>
      <p className="mt-2 text-ink/60">
        Tus clientes, agrupados por correo a partir de los pedidos pagados.
      </p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">
          ← Panel
        </Link>
        <button onClick={load} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Cargando…" : "Actualizar"}
        </button>
        {customers && (
          <span className="text-sm text-ink/55">{customers.length} cliente(s)</span>
        )}
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
          {error}
        </p>
      )}

      {customers && customers.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="font-display text-2xl font-extrabold">{customers.length}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">Clientes</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="font-display text-2xl font-extrabold text-green-600">{money(totalIngresos, cur0)}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">Ingresos de clientes</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="font-display text-2xl font-extrabold">{totalPedidos}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">Pedidos totales</p>
          </div>
        </div>
      )}

      {customers && customers.length > 0 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="mt-6 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink sm:max-w-sm"
        />
      )}

      {customers && customers.length === 0 && (
        <p className="mt-8 text-ink/55">Aún no hay clientes (no hay pedidos pagados).</p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          {/* Cabecera (escritorio) */}
          <div className="hidden border-b border-line bg-mist px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/50 sm:grid sm:grid-cols-[1fr_auto_auto_auto]">
            <span>Cliente</span>
            <span className="px-4 text-right">Pedidos</span>
            <span className="px-4 text-right">Total</span>
            <span className="text-right">Último</span>
          </div>
          {filtered.map((c) => (
            <div
              key={c.email}
              className="grid gap-1 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {initials(c.name, c.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name || "—"}</p>
                  <a
                    href={`mailto:${c.email}`}
                    className="block truncate text-sm text-ink/60 underline decoration-line underline-offset-2 hover:text-ink"
                  >
                    {c.email}
                  </a>
                  {c.lastAddress && (
                    <p className="mt-0.5 truncate text-xs text-ink/40">{c.lastAddress}</p>
                  )}
                </div>
              </div>
              <span className="px-4 text-sm sm:text-right">
                <span className="sm:hidden text-ink/50">Pedidos: </span>
                {c.orders}
              </span>
              <span className="px-4 text-sm font-medium sm:text-right">
                <span className="sm:hidden text-ink/50">Total: </span>
                {money(c.totalSpent, c.currency)}
              </span>
              <span className="text-sm text-ink/55 sm:text-right">
                {new Date(c.lastOrder * 1000).toLocaleDateString("es-CO")}
              </span>
            </div>
          ))}
        </div>
      )}

      {!customers && !loading && (
        <p className="mt-8 text-sm text-ink/45">Cargando clientes…</p>
      )}
    </div>
  );
}
