"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Coupon } from "@/lib/coupons";

export default function AdminPromociones() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [until, setUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    setSaving(true);
    setMsg(null);
    try {
      const validUntil = until ? Math.floor(new Date(until + "T23:59:59").getTime() / 1000) : undefined;
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, percent: Number(percent), validUntil }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear.");
      setCoupons((c) => [data.coupon, ...c]);
      setCode("");
      setPercent("");
      setUntil("");
      setMsg({ ok: true, text: "✓ Cupón creado." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error." });
    } finally {
      setSaving(false);
    }
  }

  async function del(c: string) {
    await fetch(`/api/admin/coupons?code=${encodeURIComponent(c)}`, { method: "DELETE" });
    setCoupons((list) => list.filter((x) => x.code !== c));
  }

  const input = "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Promociones</h1>
      <p className="mt-2 text-ink/60">Crea cupones de descuento para tus clientes.</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6">
        <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
      </div>

      {/* Crear cupón */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">Nuevo cupón</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <label className="block text-xs font-medium text-ink/60">
            Código
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MINIKO10" className={`mt-1 ${input}`} />
          </label>
          <label className="block text-xs font-medium text-ink/60">
            % descuento
            <input value={percent} onChange={(e) => setPercent(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="10" className={`mt-1 w-28 ${input}`} />
          </label>
          <label className="block text-xs font-medium text-ink/60">
            Válido hasta (opcional)
            <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={`mt-1 ${input}`} />
          </label>
          <button onClick={add} disabled={saving || !code || !percent} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
            Crear
          </button>
        </div>
        {msg && (
          <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-green-600" : "text-brand"}`}>{msg.text}</p>
        )}
      </section>

      {/* Lista */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">Cupones activos</h2>
        {loading ? (
          <p className="mt-4 text-sm text-ink/50">Cargando…</p>
        ) : coupons.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">Aún no hay cupones.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {coupons.map((c) => {
              const expired = c.validUntil && c.validUntil < Math.floor(Date.now() / 1000);
              return (
                <div key={c.code} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <span className="rounded-lg bg-mist px-2 py-1 font-mono font-bold">{c.code}</span>
                    <span className="ml-3 font-semibold text-green-600">{c.percent}% OFF</span>
                    {c.validUntil && (
                      <span className={`ml-3 text-xs ${expired ? "text-brand" : "text-ink/50"}`}>
                        {expired ? "Vencido" : "Hasta"} {new Date(c.validUntil * 1000).toLocaleDateString("es-CO")}
                      </span>
                    )}
                  </div>
                  <button onClick={() => del(c.code)} className="text-sm font-semibold text-ink/50 hover:text-brand">
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
