import Link from "next/link";
import { VARIANTS, formatCop } from "@/data/catalog";
import { getSettings, priceOf, shipOf } from "@/lib/settings";

export const metadata = {
  title: "Precios — miniko",
};

// Siempre con datos frescos: los precios se editan desde el panel admin.
export const dynamic = "force-dynamic";

const INCLUDED = [
  "Modelo 3D personalizado a partir de tu foto",
  "Figura impresa en PLA premium, sin pintar",
  "Set de pinturas acrílicas a juego",
  "Pinceles y base incluidos",
  "Guía de pintado paso a paso",
  "Caja lista para regalar",
];

export default async function PreciosPage() {
  const settings = await getSettings();
  return (
    <div className="section">
      <div className="container-x">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Precios</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold">Un precio simple por kit</h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
          <p className="mx-auto mt-4 max-w-lg text-ink/60">
            El precio depende de cuántos personajes quieras en tu figura. Todo lo demás va incluido.
          </p>
        </header>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VARIANTS.map((v, i) => {
            const price = priceOf(settings, v.id, v.priceCop);
            const free = shipOf(settings, v.people) === 0;
            return (
              <div
                key={v.id}
                className={`flex flex-col rounded-2xl border bg-white p-7 ${
                  i === 1 ? "border-ink ring-1 ring-ink/10" : "border-line"
                }`}
              >
                {i === 1 && (
                  <span className="mb-4 w-fit rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand">
                    Más popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{v.name}</h3>
                <p className="mt-1 text-sm text-ink/55">{v.description}</p>
                <div className="mt-5">
                  <span className="font-display text-3xl font-extrabold">{formatCop(price)}</span>
                </div>
                <p className="mt-1 text-xs text-ink/45">{v.height}</p>
                <p className="mt-2 text-xs font-semibold text-brand">
                  {free ? "🚚 Envío GRATIS" : `+ envío ${formatCop(settings.shippingCop)}`}
                </p>
                <Link
                  href={`/pedido?variante=${v.id}`}
                  className={`mt-6 ${i === 1 ? "btn-primary" : "btn-secondary"}`}
                >
                  Elegir
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-line p-8">
          <h2 className="font-display text-lg font-bold">Todo incluye:</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-brand text-xs text-brand">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-sm text-ink/55">
            Envío {formatCop(settings.shippingCop)} · GRATIS desde {settings.freeFromPeople} personajes
          </p>
        </div>
      </div>
    </div>
  );
}
