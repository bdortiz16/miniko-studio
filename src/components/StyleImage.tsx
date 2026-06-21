"use client";

import Image from "next/image";
import { useState } from "react";

// Imagen de estilo con respaldo: si la imagen (generada por IA en Supabase) no
// carga todavía, cae automáticamente al placeholder SVG local. Así nunca se ven
// imágenes rotas mientras no se han generado las muestras.
export default function StyleImage({
  src,
  fallback,
  alt,
  sizes,
  className,
}: {
  src: string;
  fallback: string;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
