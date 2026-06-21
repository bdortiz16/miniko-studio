"use client";

import { useState } from "react";
import Link from "next/link";

interface Result {
  ok?: boolean;
  samples?: Record<string, string>;
  errors?: Record<string, string>;
  error?: string;
}

const LABELS: Record<string, string> = {
  kawaii: "Funko Pop",
  caricatura: "Disney",
  realista: "Realista",
};

export default function AdminEstilos() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [ts, setTs] = useState(Date.now());

  async function generate(style?: string) {
    setLoading(true);
    setResult(null);
    try {
      const qs = style ? `?style=${encodeURIComponent(style)}` : "";
      const res = await fetch(`/api/generate-style-samples${qs}`);
      const data = await res.json();
      setResult(data);
      setTs(Date.now()); // refresca las imágenes (evita caché)
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Error de red." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      <div className="container-x max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold">Muestras de estilo</h1>
        <p className="mt-2 text-ink/60">
          Genera (o regenera) las 3 figuras de ejemplo con IA. Tarda ~40 segundos.
        </p>
        <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/admin" className="btn-secondary px-5 py-2 text-sm">
            ← Panel
          </Link>
          <button onClick={() => generate()} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Generando… (~40s)" : "Generar / Regenerar las 3"}
          </button>
          <button
            onClick={() => generate("realista")}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Regenerar solo Realista
          </button>
        </div>

        {loading && (
          <p className="mt-6 flex items-center gap-2 text-sm text-ink/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
            Creando las figuras con OpenAI…
          </p>
        )}

        {result?.error && (
          <p className="mt-6 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {result.error}
          </p>
        )}

        {result?.samples && (
          <>
            <p className="mt-8 text-sm font-semibold text-green-600">
              ✓ Listo. Así quedaron (recarga la home para verlas):
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {Object.entries(result.samples).map(([id, url]) => (
                <div key={id} className="rounded-2xl border border-line p-3">
                  <div
                    className="relative aspect-square w-full overflow-hidden rounded-xl"
                    style={{
                      background:
                        "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 20px 20px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${url}?t=${ts}`}
                      alt={LABELS[id] ?? id}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  </div>
                  <p className="mt-2 text-center text-sm font-semibold">{LABELS[id] ?? id}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {result?.errors && (
          <div className="mt-6 rounded-lg border border-brand/40 p-3 text-sm">
            <p className="font-semibold text-brand">Algunas fallaron:</p>
            <ul className="mt-1 list-disc pl-5 text-ink/70">
              {Object.entries(result.errors).map(([id, msg]) => (
                <li key={id}>
                  <b>{LABELS[id] ?? id}:</b> {msg}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
