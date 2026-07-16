"use client";

import { useState } from "react";
import Link from "next/link";

interface Pet {
  id: string;
  name: string;
  photo: string;
  species: string;
  breed: string;
  ownerName: string;
  ownerPhone: string;
  whatsapp: string;
  address: string;
  notes: string;
  reward: string;
  lost: boolean;
}

export default function NfcPage() {
  const [step, setStep] = useState<"email" | "code" | "order" | "edit">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [exp, setExp] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pet, setPet] = useState<Pet | null>(null);
  const [editToken, setEditToken] = useState("");
  const [editExp, setEditExp] = useState(0);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/email/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el código.");
      setToken(data.token); setExp(data.exp); setStep("code");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); } finally { setLoading(false); }
  }

  function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) { setError("Escribe el código de 6 dígitos."); return; }
    setError(null); setStep("order");
  }

  async function access(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/nfc/access", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, token, exp, orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo acceder.");
      setPet(data.pet); setEditToken(data.editToken); setEditExp(data.editExp); setStep("edit");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); } finally { setLoading(false); }
  }

  const input = "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div className="section">
      <div className="container-x max-w-lg">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Placa de mi mascota</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
          <p className="mx-auto mt-4 max-w-md text-ink/60">
            Activa y edita la página de tu mascota. Si se pierde, quien la encuentre verá tus datos al escanear el QR/NFC.
          </p>
        </header>

        <div className="mx-auto mt-8 max-w-md">
          {step === "email" && (
            <form onSubmit={sendCode} className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold">1. Tu correo</p>
              <p className="mt-1 text-xs text-ink/55">El mismo con el que compraste la placa.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" className={`mt-3 ${input}`} />
              {error && <p className="mt-3 text-sm text-brand">{error}</p>}
              <button disabled={loading || !email} className="btn-primary mt-4 w-full disabled:opacity-50">
                {loading ? "Enviando…" : "Enviar código"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={confirmCode} className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold">2. Código del correo</p>
              <p className="mt-1 text-xs text-ink/55">Te enviamos un código de 6 dígitos a {email}.</p>
              <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className={`mt-3 text-center text-lg tracking-[0.4em] ${input}`} />
              {error && <p className="mt-3 text-sm text-brand">{error}</p>}
              <button className="btn-primary mt-4 w-full">Continuar</button>
              <button type="button" onClick={() => setStep("email")} className="mt-3 w-full text-sm font-semibold text-ink/60 underline">← Cambiar correo</button>
            </form>
          )}

          {step === "order" && (
            <form onSubmit={access} className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold">3. Número de orden</p>
              <p className="mt-1 text-xs text-ink/55">El número de tu pedido (ej. 001). Lo ves en tu correo de confirmación o en “Mis pedidos”.</p>
              <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="001" className={`mt-3 ${input}`} />
              {error && <p className="mt-3 text-sm text-brand">{error}</p>}
              <button disabled={loading} className="btn-primary mt-4 w-full disabled:opacity-50">
                {loading ? "Verificando…" : "Entrar a mi mascota →"}
              </button>
            </form>
          )}

          {step === "edit" && pet && (
            <PetEditor pet={pet} editToken={editToken} editExp={editExp} />
          )}
        </div>
      </div>
    </div>
  );
}

function PetEditor({ pet: initial, editToken, editExp }: { pet: Pet; editToken: string; editExp: number }) {
  const [pet, setPet] = useState<Pet>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [qr, setQr] = useState<string>("");

  const input = "w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-ink";
  const set = (patch: Partial<Pet>) => setPet((p) => ({ ...p, ...patch }));

  async function onPhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) set({ photo: data.url });
    } finally { setUploading(false); }
  }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/nfc/pet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pet, id: pet.id, editToken, editExp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      setMsg({ ok: true, text: "✓ Guardado. Tu placa ya está actualizada." });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Error." }); } finally { setSaving(false); }
  }

  async function loadQr() {
    const res = await fetch(`/api/nfc/qr?id=${pet.id}`);
    const data = await res.json();
    if (res.ok) setQr(data.dataUrl);
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${pet.id}` : `/p/${pet.id}`;

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold">Datos de tu mascota</p>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={pet.lost} onChange={(e) => set({ lost: e.target.checked })} />
          <span className={pet.lost ? "text-brand" : "text-ink/60"}>🚨 Perdido</span>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">
          {pet.photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={pet.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-2xl">🐶</div>
          )}
        </div>
        <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink">
          {uploading ? "Subiendo…" : "Subir foto"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] || null)} />
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        <input value={pet.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nombre de la mascota" className={input} />
        <div className="grid grid-cols-2 gap-3">
          <select value={pet.species} onChange={(e) => set({ species: e.target.value })} className={input}>
            {["Perro", "Gato", "Conejo", "Ave", "Otro"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={pet.breed} onChange={(e) => set({ breed: e.target.value })} placeholder="Raza" className={input} />
        </div>
        <p className="mt-1 text-xs font-semibold uppercase text-ink/40">Contacto (lo ve quien la encuentre)</p>
        <input value={pet.ownerName} onChange={(e) => set({ ownerName: e.target.value })} placeholder="Tu nombre" className={input} />
        <div className="grid grid-cols-2 gap-3">
          <input inputMode="tel" value={pet.ownerPhone} onChange={(e) => set({ ownerPhone: e.target.value })} placeholder="Teléfono (llamar)" className={input} />
          <input inputMode="tel" value={pet.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="WhatsApp" className={input} />
        </div>
        <input value={pet.address} onChange={(e) => set({ address: e.target.value })} placeholder="Dirección / zona (opcional)" className={input} />
        <textarea value={pet.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="Notas: alergias, medicación, carácter…" className={input} />
        <input value={pet.reward} onChange={(e) => set({ reward: e.target.value })} placeholder="Recompensa si se pierde (opcional)" className={input} />
      </div>

      {msg && <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-green-600" : "text-brand"}`}>{msg.text}</p>}

      <button onClick={save} disabled={saving} className="btn-primary mt-4 w-full disabled:opacity-50">
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>

      {/* Página pública / QR */}
      <div className="mt-6 rounded-xl border border-line bg-mist/40 p-4">
        <p className="text-sm font-semibold">Tu página pública</p>
        <p className="mt-1 break-all text-xs text-brand">{publicUrl}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2 text-xs">Ver como visitante ↗</a>
          <button onClick={loadQr} className="btn-secondary px-4 py-2 text-xs">Ver código QR</button>
        </div>
        {qr && (
          <div className="mt-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR" className="mx-auto h-44 w-44" />
            <a href={qr} download={`qr-${pet.name || pet.id}.png`} className="mt-2 inline-block text-xs font-semibold text-brand underline">Descargar QR</a>
          </div>
        )}
      </div>
    </div>
  );
}
