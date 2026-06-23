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

      {/* Correo a clientes con ayuda de IA */}
      <EmailCampaign />
    </div>
  );
}

// Redacta un correo con IA, lo previsualiza y lo envía a todos los clientes.
function EmailCampaign() {
  const [brief, setBrief] = useState("");
  const [ctaUrl, setCtaUrl] = useState("https://miniko.com.co/pedido");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  const [total, setTotal] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/marketing/send")
      .then((r) => r.json())
      .then((d) => setTotal(typeof d.total === "number" ? d.total : null))
      .catch(() => {});
  }, []);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 4)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) urls.push(data.url);
      }
      setImages((prev) => [...prev, ...urls].slice(0, 4));
    } catch {
      setMsg({ ok: false, text: "No se pudo subir alguna imagen." });
    } finally {
      setUploading(false);
    }
  }

  async function compose() {
    setComposing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/marketing/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, images, ctaUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo redactar.");
      setSubject(data.subject || "");
      setHtml(data.html || "");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error." });
    } finally {
      setComposing(false);
    }
  }

  async function sendAll() {
    if (!subject || !html) return;
    const n = total ?? 0;
    if (!confirm(`¿Enviar este correo a ${n} cliente(s)? No se puede deshacer.`)) return;
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar.");
      setMsg({
        ok: true,
        text: `✓ Enviado a ${data.sent} cliente(s)${data.failed ? ` · ${data.failed} fallaron` : ""}.`,
      });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error." });
    } finally {
      setSending(false);
    }
  }

  const input = "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-lg font-bold">Correo a clientes (con IA)</h2>
      <p className="mt-1 text-sm text-ink/55">
        Escribe qué quieres decirles y sube las imágenes que quieras usar. La IA redacta el correo,
        lo ves en vista previa y, si te gusta, lo envías a{" "}
        <b>{total === null ? "tus clientes" : `${total} cliente(s)`}</b>.
      </p>

      <div className="mt-4 grid gap-4">
        <label className="block text-xs font-medium text-ink/60">
          ¿Qué quieres decirles?
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="Ej. Tenemos 20% de descuento esta semana con el cupón MINIKO20. Que aprovechen para regalar una figura en Navidad."
            className={`mt-1 ${input}`}
          />
        </label>

        <label className="block text-xs font-medium text-ink/60">
          Enlace del botón (a dónde van al hacer clic)
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://miniko.com.co/pedido" className={`mt-1 ${input}`} />
        </label>

        <div>
          <p className="text-xs font-medium text-ink/60">Imágenes (hasta 4)</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {images.map((u, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-20 w-20 rounded-xl border border-line object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-white"
                  aria-label="Quitar"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-2xl text-ink/40 hover:border-ink/40">
                {uploading ? "…" : "+"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
              </label>
            )}
          </div>
        </div>

        <div>
          <button onClick={compose} disabled={composing || !brief.trim()} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
            {composing ? "Redactando…" : "✨ Generar con IA"}
          </button>
        </div>
      </div>

      {/* Vista previa */}
      {html && (
        <div className="mt-6 border-t border-line pt-6">
          <label className="block text-xs font-medium text-ink/60">
            Asunto
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`mt-1 ${input}`} />
          </label>

          <p className="mt-4 text-xs font-medium text-ink/60">Así se verá el correo</p>
          <div className="mt-2 overflow-hidden rounded-xl border border-line">
            <iframe title="Vista previa del correo" srcDoc={html} className="h-[520px] w-full bg-white" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={sendAll} disabled={sending || !subject} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {sending ? "Enviando…" : `Enviar a todos (${total ?? 0})`}
            </button>
            <button onClick={compose} disabled={composing} className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-50">
              Volver a redactar
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`mt-4 text-sm font-semibold ${msg.ok ? "text-green-600" : "text-brand"}`}>{msg.text}</p>
      )}
    </section>
  );
}
