"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/settings";

export default function AdminPerfil() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (res.ok) setSettings(data.settings);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveEmail() {
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
      setMsg({ ok: true, text: "✓ Correo actualizado. El código de acceso llegará a este correo." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error." });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const inputCls = "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold">Perfil</h1>
      <p className="mt-2 text-ink/60">Tu cuenta de administrador y la seguridad del panel.</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6">
        <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
      </div>

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-ink/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          Cargando…
        </p>
      ) : (
        <>
          {/* Correo de acceso / avisos */}
          <section className="mt-8 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">Correo de la cuenta</h2>
            <p className="mt-1 text-sm text-ink/55">
              A este correo llegan los avisos de pedidos y el <b>código de acceso</b> cuando inicias sesión.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium">
                Tu correo
                <input
                  type="email"
                  value={settings?.adminEmail || ""}
                  onChange={(e) => settings && setSettings({ ...settings, adminEmail: e.target.value })}
                  placeholder="tucorreo@gmail.com"
                  className={`mt-1.5 ${inputCls}`}
                />
              </label>
              <button onClick={saveEmail} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
            {msg && (
              <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-green-600" : "text-brand"}`}>{msg.text}</p>
            )}
          </section>

          {/* Seguridad */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold">Seguridad</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li className="flex gap-2"><span>🔐</span> Acceso en 2 pasos: contraseña + código que llega a tu correo.</li>
              <li className="flex gap-2"><span>⏱️</span> La sesión se cierra sola tras <b>2 horas sin actividad</b>.</li>
              <li className="flex gap-2"><span>🔑</span> La contraseña se cambia desde las variables del proyecto (ADMIN_PASSWORD en Vercel). Al cambiarla, todas las sesiones se cierran.</li>
            </ul>
          </section>

          {/* Cerrar sesión */}
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6">
            <h2 className="font-display text-lg font-bold text-red-700">Cerrar sesión</h2>
            <p className="mt-1 text-sm text-ink/60">Saldrás del panel en este dispositivo.</p>
            <button
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              ← Cerrar sesión
            </button>
          </section>
        </>
      )}
    </div>
  );
}
