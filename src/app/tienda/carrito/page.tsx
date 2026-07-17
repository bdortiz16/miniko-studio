"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, addToCart, setQty, removeItem, clearCart } from "@/lib/cart";
import Upsell from "@/components/Upsell";
import { DEPARTAMENTOS_CO, citiesOf, postalOf, isValidName, isValidCel } from "@/data/colombia";

function money(cop: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cop);
  } catch {
    return `$${cop.toLocaleString("es-CO")}`;
  }
}

export default function CarritoPage() {
  const items = useCart();
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

  const subtotal = items.reduce((n, i) => n + i.unitCop * i.qty, 0);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canPay =
    items.length > 0 && validEmail && isValidName(name) && isValidCel(phone) && !!department && !!city && !!address.trim();

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout-tienda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty, designId: i.designId, customText: i.customText })),
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

  return (
    <div className="section">
      <div className="container-x max-w-4xl">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Tu carrito</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
        </header>

        {items.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-4xl">🛒</p>
            <p className="mt-3 font-semibold">Tu carrito está vacío</p>
            <Link href="/tienda" className="btn-primary mt-6">Ir a la tienda →</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Items */}
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.key} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
                  <div
                    className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-mist"
                    style={i.image ? undefined : { background: `linear-gradient(135deg, ${i.accent || "#f1f1f2"}, #fff)` }}
                  >
                    {i.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">{i.emoji || "📦"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{i.name}</p>
                    <p className="text-xs text-ink/55">
                      {[i.designName, i.customText ? `"${i.customText}"` : ""].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="text-sm font-semibold">{money(i.unitCop)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(i.key, i.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line">−</button>
                    <span className="w-5 text-center text-sm font-semibold">{i.qty}</span>
                    <button onClick={() => setQty(i.key, i.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line">+</button>
                  </div>
                  <button onClick={() => removeItem(i.key)} className="ml-1 text-ink/40 hover:text-brand" aria-label="Quitar">✕</button>
                </div>
              ))}
              <button onClick={clearCart} className="text-sm font-semibold text-ink/50 hover:text-brand">Vaciar carrito</button>
              <Upsell
                onAdd={(p, sel) => addToCart({ productId: p.id, name: p.name, unitCop: sel.unitCop, qty: 1, designId: sel.designId, designName: sel.designName, customText: sel.customText, image: p.image, emoji: p.emoji, accent: p.accent })}
              />
            </div>

            {/* Datos + pago */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="font-display text-lg font-bold">Datos de envío</p>
              <div className="mt-4 grid gap-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu correo" className={input} />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" className={input} />
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Celular (empieza en 3)" className={input} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={department} onChange={(e) => { setDepartment(e.target.value); setCity(""); setZip(""); }} className={input}>
                    <option value="">Departamento</option>
                    {DEPARTAMENTOS_CO.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                  <select value={city} onChange={(e) => { setCity(e.target.value); setZip(postalOf(department, e.target.value)); }} disabled={!department} className={input}>
                    <option value="">Ciudad</option>
                    {citiesOf(department).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" className={input} />
                <input value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Barrio / referencia (opcional)" className={input} />
              </div>

              <div className="mt-4 border-t border-line pt-4 text-sm">
                <div className="flex justify-between"><span className="text-ink/60">Productos</span><span className="font-semibold">{money(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Envío</span><span className="text-ink/60">se calcula al pagar</span></div>
              </div>

              {error && <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>}

              <button onClick={pay} disabled={!canPay || loading} className="btn-primary mt-4 w-full py-3 disabled:opacity-50">
                {loading ? "Redirigiendo…" : `Pagar ${money(subtotal)} →`}
              </button>
              <p className="mt-2 text-center text-[11px] text-ink/45">Pago seguro con Wompi · + envío</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
