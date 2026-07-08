"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";

interface Design { id: string; name: string; emoji?: string; image?: string; extraCop?: number; customLabel?: string }
interface Product {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  image: string;
  images?: string[];
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

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [designId, setDesignId] = useState("");
  const [customText, setCustomText] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const p: Product = d.product;
        setProduct(p);
        setGallery([p.image, ...(p.images || [])].filter(Boolean));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="section">
        <div className="container-x max-w-lg text-center">
          <p className="text-4xl">😕</p>
          <p className="mt-3 font-semibold">Producto no encontrado</p>
          <Link href="/tienda" className="btn-primary mt-6">← Volver a la tienda</Link>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="section">
        <div className="container-x flex justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
        </div>
      </div>
    );
  }

  const designs = product.designs || [];
  const design = designs.find((d) => d.id === designId);
  const designOk = designs.length === 0 || (!!design && (!design.customLabel || !!customText.trim()));
  const unit = product.priceCop + (design?.extraCop || 0);

  function build() {
    return {
      productId: product!.id,
      name: product!.name,
      unitCop: unit,
      qty,
      designId: design?.id,
      designName: design?.name,
      customText: customText.trim() || undefined,
      image: gallery[0] || undefined,
      emoji: product!.emoji,
      accent: product!.accent,
    };
  }

  function add() {
    if (!designOk) return;
    addToCart(build());
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    if (!designOk) return;
    addToCart(build());
    router.push("/tienda/carrito");
  }

  const input = "w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-ink";

  return (
    <div className="section">
      <div className="container-x max-w-4xl">
        <Link href="/tienda" className="text-sm font-semibold text-ink/60 hover:text-ink">← Tienda</Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          {/* Galería */}
          <div>
            <div
              className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-line bg-mist"
              style={gallery[active] ? undefined : { background: `linear-gradient(135deg, ${product.accent || "#f1f1f2"}, #fff)` }}
            >
              {gallery[active] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={gallery[active]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-8xl">{product.emoji || "📦"}</span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === active ? "border-brand" : "border-line"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info + compra */}
          <div>
            {product.category && <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">{product.category}</span>}
            <h1 className="font-display text-3xl font-extrabold">{product.name}</h1>
            <p className="mt-2 font-display text-2xl font-extrabold text-brand">{money(unit)}</p>
            {product.description && <p className="mt-3 text-ink/70">{product.description}</p>}
            {typeof product.stock === "number" && (
              <p className={`mt-2 text-sm font-semibold ${product.stock > 0 ? "text-green-600" : "text-brand"}`}>
                {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
              </p>
            )}

            {designs.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold">Elige un diseño</p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {designs.map((d) => {
                    const sel = d.id === designId;
                    return (
                      <button
                        key={d.id}
                        onClick={() => { setDesignId(d.id); setCustomText(""); }}
                        className={`flex flex-col items-center gap-1 overflow-hidden rounded-xl border p-2 text-center transition ${
                          sel ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-line hover:border-ink/40"
                        }`}
                      >
                        {d.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={d.image} alt={d.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <span className="text-2xl">{d.emoji || "🎨"}</span>
                        )}
                        <span className="text-[11px] font-medium leading-tight">{d.name}</span>
                        {d.extraCop ? <span className="text-[10px] text-ink/50">+{money(d.extraCop)}</span> : null}
                      </button>
                    );
                  })}
                </div>
                {design?.customLabel && (
                  <label className="mt-3 block text-xs font-medium text-ink/60">
                    {design.customLabel}
                    <input value={customText} onChange={(e) => setCustomText(e.target.value.slice(0, 80))} placeholder={design.customLabel} className={`mt-1 ${input}`} />
                  </label>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <span className="text-sm font-medium text-ink/70">Cantidad</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty((n) => Math.max(1, n - 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line">−</button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((n) => Math.min(20, n + 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line">+</button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={add}
                disabled={!designOk || product.stock === 0}
                className="btn-secondary flex-1 py-3 disabled:opacity-50"
              >
                {added ? "✓ Agregado" : "Agregar al carrito"}
              </button>
              <button
                onClick={buyNow}
                disabled={!designOk || product.stock === 0}
                className="btn-primary flex-1 py-3 disabled:opacity-50"
              >
                Comprar ahora →
              </button>
            </div>
            {!designOk && designs.length > 0 && (
              <p className="mt-2 text-xs text-brand">Elige un diseño{design?.customLabel ? " y completa el dato" : ""}.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
