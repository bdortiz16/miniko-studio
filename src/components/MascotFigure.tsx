"use client";

import { useState } from "react";

// Muestra la figura de mascota generada con IA; si aún no existe (o falla la
// carga), cae al emoji para que la sección nunca se vea rota.
export default function MascotFigure({
  src,
  emoji,
  alt,
}: {
  src: string;
  emoji: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return <div className="text-5xl">{emoji}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="mx-auto h-24 w-24 object-contain"
    />
  );
}
