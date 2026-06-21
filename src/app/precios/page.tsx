import Link from "next/link";
import { VARIANTS, formatEur } from "@/data/catalog";

export const metadata = {
  title: "Precios — Miniko Studio",
};

const INCLUDED = [
  "Modelo 3D personalizado a partir de tu foto",
  "Figura impresa en PLA premium, sin pintar",
  "Set de pinturas acrílicas a juego",
  "Pinceles y base incluidos",
  "Guía de pintado paso a paso",
  "Caja lista para regalar",
];

export default function PreciosPage() {
  return (
    <div className="section">
      <div className="container-x">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
            Precios
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold">
            Un precio simple por kit
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-ink/60">
            El precio depende de cuántos personajes quieras en tu figura. Todo lo
            demás va incluido.
          </p>
        </header>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VARIANTS.map((v, i) => (
            <div
              key={v.id}
              className={`flex flex-col rounded-3xl border p-7 ${
                i === 1
                  ? "border-terracotta bg-white shadow-xl ring-1 ring-terracotta/20"
                  : "border-ink/10 bg-white shadow-sm"
              }`}
            >
              {i === 1 && (
                <span className="mb-4 w-fit rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-white">
                  Más popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{v.name}</h3>
              <p className="mt-1 text-sm text-ink/55">{v.description}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold">
                  {formatEur(v.priceCents)}
                </span>
                <span className="mb-1 text-sm text-ink/50">/ kit</span>
              </div>
              <p className="mt-1 text-xs text-ink/45">{v.height}</p>
              <Link
                href={`/personalizar?variante=${v.id}`}
                className={`mt-6 ${i === 1 ? "btn-primary" : "btn-secondary"}`}
              >
                Elegir
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="font-display text-lg font-bold">Todo incluye:</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-terracotta/15 text-xs text-terracotta">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-sm text-ink/55">
            Envío 4,99 € · Gratis en pedidos superiores a 55 €
          </p>
        </div>
      </div>
    </div>
  );
}
