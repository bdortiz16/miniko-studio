"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Pet {
  id: string;
  name: string;
  photo: string;
  species: string;
  breed: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  orderReference: string;
  lost: boolean;
  updatedAt: number;
}

export default function AdminMascotas() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<{ id: string; dataUrl: string; url: string } | null>(null);
  const [copied, setCopied] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://miniko.com.co";
  function copyUrl(id: string) {
    const url = `${origin}/p/${id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  async function load() {
    try {
      const res = await fetch("/api/admin/pets");
      const data = await res.json();
      setPets(data.pets || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function del(id: string) {
    if (!confirm("¿Eliminar esta placa/mascota?")) return;
    await fetch(`/api/admin/pets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setPets((l) => l.filter((p) => p.id !== id));
  }

  async function showQr(id: string) {
    const res = await fetch(`/api/nfc/qr?id=${id}`);
    const data = await res.json();
    if (res.ok) setQr({ id, dataUrl: data.dataUrl, url: data.url });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Mascotas (NFC)</h1>
      <p className="mt-2 text-ink/60">
        Cada placa vendida genera una página. <b>Copia su URL y grábala en el chip NFC</b> (con NFC Tools u otra app)
        antes de enviarla. El cliente edita esa misma página en /nfc.
      </p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6">
        <Link href="/panel-mk9z3" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
      </div>

      <section className="mt-6">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando…</p>
        ) : pets.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink/55">
            Aún no hay placas activadas. Cuando un cliente registre su mascota en <b>/nfc</b>, aparecerá aquí.
          </p>
        ) : (
          <div className="space-y-3">
            {pets.map((p) => (
              <div key={p.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">
                    {p.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl">🐶</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {p.name || "Sin activar por el cliente"}
                      {p.lost && <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">Perdido</span>}
                    </p>
                    <p className="text-sm text-ink/55">{[p.species, p.breed].filter(Boolean).join(" · ") || "—"} · {p.ownerName || p.ownerEmail || "—"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <a href={`/p/${p.id}`} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Ver ↗</a>
                    <button onClick={() => showQr(p.id)} className="font-semibold text-ink/60 hover:text-ink">QR</button>
                    <button onClick={() => del(p.id)} className="text-ink/40 hover:text-brand">Eliminar</button>
                  </div>
                </div>
                {/* URL para grabar en el NFC */}
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-mist/50 p-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink/70">{origin}/p/{p.id}</span>
                  <button onClick={() => copyUrl(p.id)} className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
                    {copied === p.id ? "✓ Copiado" : "Copiar URL"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {qr && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={() => setQr(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="font-display font-bold">Código QR</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt="QR" className="mx-auto mt-3 h-56 w-56" />
            <p className="mt-2 break-all text-xs text-ink/50">{qr.url}</p>
            <div className="mt-4 flex justify-center gap-3">
              <a href={qr.dataUrl} download={`qr-${qr.id}.png`} className="btn-primary px-5 py-2 text-sm">Descargar</a>
              <button onClick={() => setQr(null)} className="btn-secondary px-5 py-2 text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
