"use client";

import { useEffect, useState } from "react";

export interface UpsellProduct {
  id: string;
  name: string;
  priceCop: number;
  image: string;
  emoji?: string;
  accent?: string;
  stock?: number;
  designs?: unknown[];
}

function money(cop: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cop);
  } catch {
    return `$${cop.toLocaleString("es-CO")}`;
  }
}

// Fila de "Agrega también…" (estilo Rappi) antes de pagar. Solo ofrece
// productos simples (sin diseños) para agregarlos con un toque.
export default function Upsell({
  exclude = [],
  onAdd,
  title = "Agrega también 👇",
}: {
  exclude?: string[];
  onAdd: (p: UpsellProduct) => void;
  title?: string;
}) {
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, []);

  const list = products
    .filter((p) => (!p.designs || p.designs.length === 0) && p.stock !== 0 && !exclude.includes(p.id))
    .slice(0, 8);

  if (list.length === 0) return null;

  function add(p: UpsellProduct) {
    onAdd(p);
    setAdded((a) => ({ ...a, [p.id]: true }));
    setTimeout(() => setAdded((a) => ({ ...a, [p.id]: false })), 1200);
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {list.map((p) => (
          <div key={p.id} className="flex w-32 shrink-0 flex-col rounded-xl border border-line bg-white p-2">
            <div
              className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg bg-mist"
              style={p.image ? undefined : { background: `linear-gradient(135deg, ${p.accent || "#f1f1f2"}, #fff)` }}
            >
              {p.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl">{p.emoji || "📦"}</span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight">{p.name}</p>
            <p className="text-xs text-ink/55">{money(p.priceCop)}</p>
            <button
              onClick={() => add(p)}
              className={`mt-2 rounded-full px-2 py-1.5 text-xs font-bold transition ${
                added[p.id] ? "bg-green-500 text-white" : "bg-ink text-white hover:bg-black"
              }`}
            >
              {added[p.id] ? "✓ Agregado" : "+ Agregar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
