"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { STYLES, VARIANTS, StyleId, formatEur } from "@/data/catalog";
import { useCart } from "@/lib/cart";

export default function Personalizar() {
  const router = useRouter();
  const params = useSearchParams();
  const { addItem } = useCart();

  const initialStyle = (params.get("estilo") as StyleId) || STYLES[0].id;
  const [styleId, setStyleId] = useState<StyleId>(
    STYLES.some((s) => s.id === initialStyle) ? initialStyle : STYLES[0].id
  );
  const [variantId, setVariantId] = useState(VARIANTS[0].id);
  const [added, setAdded] = useState(false);

  const style = STYLES.find((s) => s.id === styleId)!;
  const variant = VARIANTS.find((v) => v.id === variantId)!;

  function handleAdd(goToCart: boolean) {
    addItem(styleId, variantId, 1);
    if (goToCart) {
      router.push("/carrito");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  }

  return (
    <div className="section">
      <div className="container-x">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
            Personaliza
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Crea tu figura
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-ink/60">
            Elige el estilo y el tamaño. Tras el pago te pediremos la foto para
            crear tu modelo 3D.
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Preview */}
          <div
            className="relative flex aspect-[4/3] items-end overflow-hidden rounded-3xl p-6"
            style={{ backgroundColor: `${style.accent}22` }}
          >
            <Image
              src={style.image}
              alt={`Estilo ${style.name}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="relative z-10 rounded-2xl bg-white/90 px-5 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
                {style.tagline}
              </p>
              <p className="font-display text-lg font-bold">
                Estilo {style.name} · {variant.name}
              </p>
            </div>
          </div>

          {/* Opciones */}
          <div>
            <h2 className="font-display text-lg font-bold">1. Estilo</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className={`rounded-2xl border p-3 text-center transition ${
                    s.id === styleId
                      ? "border-terracotta bg-terracotta/5 ring-2 ring-terracotta/30"
                      : "border-ink/10 bg-white hover:border-ink/25"
                  }`}
                >
                  <span
                    className="mx-auto block h-3 w-3 rounded-full"
                    style={{ backgroundColor: s.accent }}
                  />
                  <span className="mt-2 block text-sm font-semibold">{s.name}</span>
                </button>
              ))}
            </div>

            <h2 className="mt-8 font-display text-lg font-bold">2. Tamaño</h2>
            <div className="mt-3 space-y-3">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                    v.id === variantId
                      ? "border-terracotta bg-terracotta/5 ring-2 ring-terracotta/30"
                      : "border-ink/10 bg-white hover:border-ink/25"
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{v.name}</span>
                    <span className="block text-sm text-ink/55">{v.description}</span>
                    <span className="mt-0.5 block text-xs text-ink/45">{v.height}</span>
                  </span>
                  <span className="font-display text-lg font-bold text-terracotta">
                    {formatEur(v.priceCents)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-sand px-5 py-4">
              <span className="text-sm text-ink/70">Precio</span>
              <span className="font-display text-2xl font-extrabold">
                {formatEur(variant.priceCents)}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => handleAdd(true)} className="btn-primary flex-1">
                Comprar ahora →
              </button>
              <button onClick={() => handleAdd(false)} className="btn-secondary flex-1">
                {added ? "✓ Añadido" : "Añadir al carrito"}
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-ink/45">
              Pago seguro con Stripe · Envío 4,99 € · Gratis a partir de 55 €
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
