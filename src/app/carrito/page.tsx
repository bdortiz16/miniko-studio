"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, describeItem } from "@/lib/cart";
import { formatEur, SHIPPING } from "@/data/catalog";

export default function CarritoPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    subtotalCents,
    shippingCents,
    totalCents,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            styleId: i.styleId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="section">
        <div className="container-x text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-sand text-4xl">
            🛒
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold">
            Tu carrito está vacío
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-ink/60">
            Aún no has añadido ninguna figura. ¡Crea la tuya!
          </p>
          <Link href="/personalizar" className="btn-primary mt-7">
            Crear mi figura →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-x">
        <h1 className="font-display text-3xl font-extrabold">Tu carrito</h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Líneas */}
          <div className="space-y-4">
            {items.map((item) => {
              const info = describeItem(item);
              return (
                <div
                  key={item.lineId}
                  className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-4"
                >
                  {info.styleImage && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <Image
                        src={info.styleImage}
                        alt={info.styleName}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          Figura {info.styleName}
                        </h3>
                        <p className="text-sm text-ink/55">{info.variantName}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.lineId)}
                        className="text-sm text-ink/40 transition hover:text-terracotta"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-full border border-ink/15">
                        <button
                          onClick={() =>
                            updateQuantity(item.lineId, item.quantity - 1)
                          }
                          className="grid h-8 w-8 place-items-center text-lg"
                          aria-label="Disminuir"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.lineId, item.quantity + 1)
                          }
                          className="grid h-8 w-8 place-items-center text-lg"
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display font-bold">
                        {formatEur(info.unitCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="h-fit rounded-2xl border border-ink/10 bg-white p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-bold">Resumen</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Subtotal</dt>
                <dd className="font-medium">{formatEur(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Envío</dt>
                <dd className="font-medium">
                  {shippingCents === 0 ? "Gratis" : formatEur(shippingCents)}
                </dd>
              </div>
              {shippingCents > 0 && (
                <p className="text-xs text-ink/45">
                  Añade {formatEur(SHIPPING.freeThresholdCents - subtotalCents)}{" "}
                  más para conseguir envío gratis.
                </p>
              )}
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-lg font-extrabold">
                  {formatEur(totalCents)}
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={checkout}
              disabled={loading}
              className="btn-primary mt-6 w-full disabled:opacity-60"
            >
              {loading ? "Redirigiendo…" : "Pagar con Stripe →"}
            </button>
            <Link
              href="/personalizar"
              className="mt-3 block text-center text-sm text-ink/55 transition hover:text-ink"
            >
              Seguir comprando
            </Link>
            <p className="mt-4 text-center text-xs text-ink/40">
              🔒 Pago seguro procesado por Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
