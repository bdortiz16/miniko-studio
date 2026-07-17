"use client";

import { useEffect, useState } from "react";

interface Design { id: string; name: string; emoji?: string; extraCop?: number; customLabel?: string }
export interface UpsellProduct {
  id: string;
  name: string;
  priceCop: number;
  image: string;
  emoji?: string;
  accent?: string;
  stock?: number;
  designs?: Design[];
}

export interface UpsellSelection {
  designId?: string;
  designName?: string;
  customText?: string;
  unitCop: number;
}

function money(cop: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cop);
  } catch {
    return `$${cop.toLocaleString("es-CO")}`;
  }
}

// Fila de "Agrega también…" (estilo Rappi) antes de pagar. Ofrece productos
// adicionales; si el producto tiene diseños, abre un mini-selector rápido.
export default function Upsell({
  exclude = [],
  onAdd,
  title = "Agrega también 👇",
}: {
  exclude?: string[];
  onAdd: (p: UpsellProduct, sel: UpsellSelection) => void;
  title?: string;
}) {
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [picking, setPicking] = useState<UpsellProduct | null>(null);
  const [flash, setFlash] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, []);

  const list = products.filter((p) => p.stock !== 0 && !exclude.includes(p.id)).slice(0, 10);
  if (list.length === 0) return null;

  function quickAdd(p: UpsellProduct) {
    if (p.designs && p.designs.length > 0) {
      setPicking(p);
      return;
    }
    onAdd(p, { unitCop: p.priceCop });
    setFlash((f) => ({ ...f, [p.id]: true }));
    setTimeout(() => setFlash((f) => ({ ...f, [p.id]: false })), 1200);
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
            <p className="text-xs text-ink/55">
              {p.designs && p.designs.length > 0 ? "desde " : ""}{money(p.priceCop)}
            </p>
            <button
              onClick={() => quickAdd(p)}
              className={`mt-2 rounded-full px-2 py-1.5 text-xs font-bold transition ${
                flash[p.id] ? "bg-green-500 text-white" : "bg-ink text-white hover:bg-black"
              }`}
            >
              {flash[p.id] ? "✓ Agregado" : p.designs && p.designs.length > 0 ? "Elegir" : "+ Agregar"}
            </button>
          </div>
        ))}
      </div>

      {picking && (
        <DesignPicker
          product={picking}
          onClose={() => setPicking(null)}
          onConfirm={(sel) => { onAdd(picking, sel); setPicking(null); }}
        />
      )}
    </div>
  );
}

function DesignPicker({
  product,
  onClose,
  onConfirm,
}: {
  product: UpsellProduct;
  onClose: () => void;
  onConfirm: (sel: UpsellSelection) => void;
}) {
  const designs = product.designs || [];
  const [designId, setDesignId] = useState("");
  const [customText, setCustomText] = useState("");
  const design = designs.find((d) => d.id === designId);
  const ok = !!design && (!design.customLabel || !!customText.trim());
  const unitCop = product.priceCop + (design?.extraCop || 0);
  const input = "w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-display font-bold">{product.name}</p>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">✕</button>
        </div>
        <p className="mt-2 text-xs font-semibold text-ink/60">Elige un diseño</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {designs.map((d) => {
            const sel = d.id === designId;
            return (
              <button
                key={d.id}
                onClick={() => { setDesignId(d.id); setCustomText(""); }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${sel ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-line hover:border-ink/40"}`}
              >
                <span className="text-xl">{d.emoji || "🎨"}</span>
                <span className="text-[10px] font-medium leading-tight">{d.name}</span>
              </button>
            );
          })}
        </div>
        {design?.customLabel && (
          <input value={customText} onChange={(e) => setCustomText(e.target.value.slice(0, 80))} placeholder={design.customLabel} className={`mt-3 ${input}`} />
        )}
        <button
          onClick={() => onConfirm({ designId: design!.id, designName: design!.name, customText: customText.trim() || undefined, unitCop })}
          disabled={!ok}
          className="btn-primary mt-4 w-full py-2.5 text-sm disabled:opacity-50"
        >
          Agregar · {money(unitCop)}
        </button>
      </div>
    </div>
  );
}
