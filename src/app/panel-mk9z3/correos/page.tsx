"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Redacta un correo con IA, lo previsualiza y lo envía a todos los clientes.
export default function AdminCorreos() {
  const [brief, setBrief] = useState("");
  const [ctaUrl, setCtaUrl] = useState("https://miniko.com.co/pedido");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  const [total, setTotal] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    setConfirmOpen(false);
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
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Correos</h1>
      <p className="mt-2 text-ink/60">Escribe un correo con ayuda de IA y envíalo a todos tus clientes.</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6">
        <Link href="/panel-mk9z3" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">Nuevo correo (con IA)</h2>
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
              <button onClick={() => setConfirmOpen(true)} disabled={sending || !subject} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
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

      {/* Ventana de confirmación (reemplaza el confirm del navegador) */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-2xl">📣</span>
              <h3 className="font-display text-lg font-bold">Enviar correo</h3>
            </div>
            <p className="mt-3 text-sm text-ink/70">
              Vas a enviar este correo a <b>{total ?? 0} cliente(s)</b>. Esta acción no se puede deshacer.
            </p>
            <div className="mt-3 rounded-xl border border-line bg-mist/50 px-3 py-2 text-sm">
              <span className="text-ink/50">Asunto:</span> <b className="text-ink">{subject}</b>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="btn-secondary px-5 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={sendAll} disabled={sending} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
                {sending ? "Enviando…" : `Enviar a ${total ?? 0}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
