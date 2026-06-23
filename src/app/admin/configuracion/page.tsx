"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";

export default function AdminConfiguracion() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [genIcons, setGenIcons] = useState(false);

  async function generarIconos() {
    setGenIcons(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/generate-icons", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron generar los íconos.");
      setSettings((s) => (s ? { ...s, whatsappIcon: data.whatsappIcon, supportIcon: data.supportIcon } : s));
      setMsg({ ok: true, text: "✓ Funkos generados. Ya aparecen en los botones." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error al generar." });
    } finally {
      setGenIcons(false);
    }
  }

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

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      // Enviamos toda la configuración para no pisar precios/envío.
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      setSettings(data.settings);
      setMsg({ ok: true, text: "✓ Guardado." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error al guardar." });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold">Configuración</h1>
      <p className="mt-2 text-ink/60">Ajustes generales de tu tienda.</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6">
        <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
      </div>

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-ink/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          Cargando…
        </p>
      ) : settings ? (
        <>
          {/* Perfil / correo de avisos */}
          <section className="mt-8 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">Correo de avisos</h2>
            <p className="mt-1 text-sm text-ink/55">
              Aquí te llega el aviso cuando entra un pedido nuevo. Puedes cambiarlo cuando quieras.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Tu correo</label>
              <input
                type="email"
                value={settings.adminEmail || ""}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                placeholder="tucorreo@gmail.com"
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
          </section>

          {/* WhatsApp de soporte */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">WhatsApp de soporte</h2>
            <p className="mt-1 text-sm text-ink/55">
              Escribe solo tu número (con o sin el 57). La web arma el enlace y manda al cliente a tu
              WhatsApp Business. Aparece en el botón flotante y en &quot;Contacto&quot;. Déjalo vacío
              para ocultar el botón.
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

          {/* Funkos con IA */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">Íconos Funko (IA)</h2>
            <p className="mt-1 text-sm text-ink/55">
              Genera con IA un Funko con camiseta de WhatsApp (para el botón de soporte) y un Funko
              asistente. Reemplazan los íconos actuales de los botones flotantes.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {settings.whatsappIcon && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={settings.whatsappIcon} alt="Funko WhatsApp" className="h-20 w-20 rounded-xl border border-line object-contain" />
              )}
              {settings.supportIcon && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={settings.supportIcon} alt="Funko soporte" className="h-20 w-20 rounded-xl border border-line object-contain" />
              )}
              <button onClick={generarIconos} disabled={genIcons} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
                {genIcons ? "Generando… (puede tardar)" : settings.whatsappIcon ? "Regenerar Funkos" : "Generar Funkos con IA"}
              </button>
            </div>
          </section>

          {msg && (
            <p className={`mt-6 rounded-lg border px-3 py-2 text-sm ${msg.ok ? "border-green-300 text-green-600" : "border-brand/40 text-brand"}`}>
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
          <p className="mt-8 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{msg.text}</p>
        )
      )}
    </div>
  );
}
