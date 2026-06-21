"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
      <p className="mt-1 text-ink/60">Resumen y gestión de tu tienda.</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Link
          href="/admin/pedidos"
          className="rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink/30"
        >
          <div className="text-3xl">📦</div>
          <h2 className="mt-3 font-display text-xl font-bold">Pedidos</h2>
          <p className="mt-1 text-sm text-ink/60">
            Pedidos pagados pendientes: foto del cliente, diseño IA y datos de envío.
          </p>
          <span className="mt-4 inline-block font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4">
            Ver pedidos →
          </span>
        </Link>

        <Link
          href="/admin/estilos"
          className="rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink/30"
        >
          <div className="text-3xl">🎨</div>
          <h2 className="mt-3 font-display text-xl font-bold">Muestras de estilo</h2>
          <p className="mt-1 text-sm text-ink/60">
            Genera o regenera las figuras de ejemplo (Funko Pop, Disney, Realista).
          </p>
          <span className="mt-4 inline-block font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4">
            Gestionar estilos →
          </span>
        </Link>
      </div>
    </div>
  );
}
