"use client";

import { useEffect, useState } from "react";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const COUNT = 6;
// Si una imagen de galería no existe aún, cae a las muestras de estilo.
const FALLBACK = ["caricatura", "kawaii", "realista"];

function galleryUrl(i: number): string {
  if (!SUPA) return `/styles/${FALLBACK[i % FALLBACK.length]}.svg`;
  return `${SUPA}/storage/v1/object/public/pedidos/gallery/${i + 1}.png?v=1`;
}
function fallbackUrl(i: number): string {
  return SUPA
    ? `${SUPA}/storage/v1/object/public/pedidos/samples/${FALLBACK[i % FALLBACK.length]}.png?v=5`
    : `/styles/${FALLBACK[i % FALLBACK.length]}.svg`;
}

export default function ShowcaseGallery() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % COUNT), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
      {Array.from({ length: COUNT }).map((_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={galleryUrl(i)}
          alt={`Figura ${i + 1}`}
          onError={(e) => {
            const t = e.currentTarget;
            if (!t.dataset.fb) {
              t.dataset.fb = "1";
              t.src = fallbackUrl(i);
            }
          }}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Indicadores */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: COUNT }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === active ? "w-5 bg-brand" : "w-1.5 bg-ink/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
