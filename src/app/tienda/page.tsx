"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Design { id: string; name: string; emoji?: string; extraCop?: number; customLabel?: string }
interface Product {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  image: string;
  category?: string;
  stock?: number;
  emoji?: string;
  accent?: string;
  designs?: Design[];
}

function money(cop: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cop);
  } catch {
    return `$${cop.toLocaleString("es-CO")}`;
  }
}

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => p.category && set.add(p.category));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products || []).filter((p) => {
      const okCat = cat === "Todos" || p.category === cat;
      const okQ = !term || p.name.toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term);
      return okCat && okQ;
    });
  }, [products, cat, q]);

  return (
    <div className="section">
      <div className="container-x">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Tienda</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
          <p className="mx-auto mt-4 max-w-md text-ink/60">
            Llaveros y artículos impresos en 3D. Elige, personaliza y te lo enviamos. 📦
          </p>
        </header>

        {/* Buscador */}
        <div className="mx-auto mt-8 max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto…"
            className="w-full rounded-full border border-line px-5 py-2.5 text-sm outline-none focus:border-ink"
          />
        </div>

        {/* Categorías */}
        {categories.length > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  cat === c ? "border-ink bg-ink text-white" : "border-line text-ink/70 hover:border-ink/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {products === null ? (
          <div className="mt-12 flex justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-4xl">🛍️</p>
            <p className="mt-3 font-semibold">No encontramos productos</p>
            <p className="mt-1 text-sm text-ink/55">Prueba con otra categoría o búsqueda.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/tienda/${p.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg"
              >
                <div
                  className="grid aspect-square w-full place-items-center overflow-hidden bg-mist"
                  style={p.image ? undefined : { background: `linear-gradient(135deg, ${p.accent || "#f1f1f2"}, #ffffff)` }}
                >
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <span className="text-7xl drop-shadow-sm">{p.emoji || "📦"}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  {p.category && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">{p.category}</span>}
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-ink/60">{p.description}</p>}
                  {p.designs && p.designs.length > 0 && (
                    <p className="mt-2 text-xs font-semibold text-brand">{p.designs.length} diseños · personalizable</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-display text-xl font-extrabold">
                      {p.designs && p.designs.length > 0 ? "desde " : ""}{money(p.priceCop)}
                    </span>
                    <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition group-hover:bg-black">
                      {p.stock === 0 ? "Agotado" : "Ver →"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
