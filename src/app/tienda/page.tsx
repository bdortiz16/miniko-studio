"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEPARTAMENTOS_CO, citiesOf, postalOf, isValidName, isValidCel } from "@/data/colombia";

interface Product {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  image: string;
  stock?: number;
  emoji?: string;
  accent?: string;
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
  const [buying, setBuying] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="section">
      <div className="container-x">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Tienda</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
          <p className="mx-auto mt-4 max-w-md text-ink/60">
            Llaveros y artículos impresos en 3D. Elige, paga y te lo enviamos. 📦
          </p>
        </header>

        {products === null ? (
          <div className="mt-12 flex justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-4xl">🛍️</p>
            <p className="mt-3 font-semibold">Pronto tendremos productos aquí</p>
            <p className="mt-1 text-sm text-ink/55">Mientras tanto, crea tu figura personalizada.</p>
            <Link href="/pedido" className="btn-primary mt-6">Crear mi figura →</Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
                <div
                  className="grid aspect-square w-full place-items-center overflow-hidden bg-mist"
                  style={p.image ? undefined : { background: `linear-gradient(135deg, ${p.accent || "#f1f1f2"}, #ffffff)` }}
                >
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-7xl drop-shadow-sm">{p.emoji || "📦"}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  {p.description && <p className="mt-1 text-sm text-ink/60">{p.description}</p>}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl font-extrabold">{money(p.priceCop)}</span>
                    <button
                      onClick={() => setBuying(p)}
                      disabled={p.stock === 0}
                      className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                    >
                      {p.stock === 0 ? "Agotado" : "Comprar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {buying && <BuyModal product={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}

function BuyModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  const [barrio, setBarrio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canPay =
    validEmail && isValidName(name) && isValidCel(phone) && !!department && !!city && !!address.trim();

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout-tienda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          qty,
          email,
          shipping: { name, phone, address, reference: barrio, city, department, zip, country: "Colombia" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
      setLoading(false);
    }
  }

  const input = "w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-ink";
  const total = product.priceCop * qty;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-mist"
            style={product.image ? undefined : { background: `linear-gradient(135deg, ${product.accent || "#f1f1f2"}, #fff)` }}
          >
            {product.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">{product.emoji || "📦"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold">{product.name}</h3>
            <p className="text-sm text-ink/60">{money(product.priceCop)} c/u</p>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">✕</button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium text-ink/70">Cantidad</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line">−</button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line">+</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu correo" className={input} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" className={input} />
          {name && !isValidName(name) && <p className="-mt-1 text-xs text-brand">Escribe nombre y apellido.</p>}
          <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Celular (empieza en 3)" className={input} />
          {phone && !isValidCel(phone) && <p className="-mt-1 text-xs text-brand">Celular de 10 dígitos que empieza en 3.</p>}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setCity(""); setZip(""); }}
              className={input}
            >
              <option value="">Departamento</option>
              {DEPARTAMENTOS_CO.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setZip(postalOf(department, e.target.value)); }}
              disabled={!department}
              className={input}
            >
              <option value="">Ciudad</option>
              {citiesOf(department).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección (Cll 82 # 37-68)" className={input} />
          <input value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Barrio / referencia (opcional)" className={input} />
          <div className="grid grid-cols-2 gap-3">
            <input value={zip} readOnly placeholder="Código postal" className={`${input} bg-mist/50 text-ink/60`} />
            <input value="Colombia" readOnly className={`${input} bg-mist/50 text-ink/60`} />
          </div>
        </div>

        {error && <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>}

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <div>
            <p className="text-xs text-ink/50">Total productos</p>
            <p className="font-display text-xl font-extrabold">{money(total)}</p>
            <p className="text-[11px] text-ink/45">+ envío al pagar</p>
          </div>
          <button onClick={pay} disabled={!canPay || loading} className="btn-primary px-6 py-3 disabled:opacity-50">
            {loading ? "Redirigiendo…" : "Ir a pagar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
