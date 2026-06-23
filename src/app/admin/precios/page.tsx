"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VARIANTS, formatCop } from "@/data/catalog";
import type { Settings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";

export default function AdminPrecios() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo cargar.");
        setSettings(data.settings);
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Error al cargar." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setPrice(id: string, value: string) {
    if (!settings) return;
    const n = Number(value.replace(/\D/g, ""));
    setSettings({ ...settings, prices: { ...settings.prices, [id]: n } });
  }

  async function save() {
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
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      setSettings(data.settings);
      setMsg({ ok: true, text: "✓ Guardado. Los precios ya están activos en la tienda." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error al guardar." });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold">Precios y envío</h1>
      <p className="mt-2 text-ink/60">
        Cambia los precios (en pesos colombianos) y las reglas de envío. Se aplican
        al instante en toda la tienda.
      </p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6">
        <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">
          ← Panel
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-ink/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          Cargando configuración…
        </p>
      ) : settings ? (
        <>
          {/* Precios */}
          <section className="mt-8 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">Precios por paquete</h2>
            <p className="mt-1 text-sm text-ink/55">Precio en COP, sin puntos ni símbolos.</p>
            <div className="mt-5 space-y-4">
              {VARIANTS.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-xs text-ink/50">
                      {v.people} {v.people === 1 ? "personaje" : "personajes"} ·{" "}
                      {formatCop(settings.prices[v.id] ?? v.priceCop)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink/40">$</span>
                    <input
                      inputMode="numeric"
                      value={settings.prices[v.id] ?? ""}
                      onChange={(e) => setPrice(v.id, e.target.value)}
                      className="w-36 rounded-xl border border-line px-4 py-2.5 text-right outline-none focus:border-ink"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Envío */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">Envío</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Costo de envío (COP)</label>
                <input
                  inputMode="numeric"
                  value={settings.shippingCop}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shippingCop: Number(e.target.value.replace(/\D/g, "")),
                    })
                  }
                  className={`mt-1.5 ${inputCls}`}
                />
                <p className="mt-1 text-xs text-ink/45">{formatCop(settings.shippingCop)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Envío gratis desde (personajes)</label>
                <input
                  inputMode="numeric"
                  value={settings.freeFromPeople}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      freeFromPeople: Number(e.target.value.replace(/\D/g, "")) || 1,
                    })
                  }
                  className={`mt-1.5 ${inputCls}`}
                />
                <p className="mt-1 text-xs text-ink/45">
                  Gratis con {settings.freeFromPeople} o más personajes
                </p>
              </div>
            </div>
          </section>

          {/* WhatsApp de soporte */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">WhatsApp de soporte</h2>
            <p className="mt-1 text-sm text-ink/55">
              Escribe solo tu número (con o sin el 57). La web arma el enlace y manda al cliente a tu
              WhatsApp Business. Aparece en el botón flotante y en &quot;Contacto&quot;.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Número de WhatsApp</label>
              <input
                inputMode="tel"
                value={settings.whatsapp || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="3001234567"
                className={`mt-1.5 ${inputCls}`}
              />
              {settings.whatsapp && waUrl(settings.whatsapp) ? (
                <p className="mt-2 text-xs text-ink/50">
                  Enlace:{" "}
                  <a href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" className="text-brand underline">
                    {waUrl(settings.whatsapp)}
                  </a>
                </p>
              ) : (
                <p className="mt-2 text-xs text-ink/40">Vacío = no se muestra el botón de WhatsApp.</p>
              )}
            </div>
          </section>

          {msg && (
            <p
              className={`mt-6 rounded-lg border px-3 py-2 text-sm ${
                msg.ok ? "border-green-300 text-green-600" : "border-brand/40 text-brand"
              }`}
            >
              {msg.text}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={save} disabled={saving} className="btn-primary px-8 disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </>
      ) : (
        msg && (
          <p className="mt-8 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {msg.text}
          </p>
        )
      )}
    </div>
  );
}
