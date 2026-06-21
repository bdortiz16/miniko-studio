// Catálogo de Miniko Studio.
// Las imágenes son placeholders (SVG en /public/styles). Sustitúyelas por tus
// fotos reales cuando las tengas, manteniendo el mismo nombre de archivo o
// actualizando la ruta "image" de cada estilo.

export type StyleId = "kawaii" | "realista" | "caricatura";

export interface FigureStyle {
  id: StyleId;
  name: string;
  tagline: string;
  description: string;
  image: string; // ruta dentro de /public
  accent: string; // color de acento (tailwind hex)
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  // Precio en céntimos de euro (Stripe trabaja con la menor unidad).
  priceCents: number;
  height: string;
}

export const STYLES: FigureStyle[] = [
  {
    id: "kawaii",
    name: "Kawaii",
    tagline: "Tierno y adorable",
    description:
      "Rasgos suaves, ojos grandes y proporciones achuchables. El estilo más dulce, perfecto para regalos entrañables.",
    image: "/styles/kawaii.svg",
    accent: "#e89ab0",
  },
  {
    id: "realista",
    name: "Realista",
    tagline: "Fiel a la foto",
    description:
      "Detalle y proporciones realistas. Capturamos los rasgos tal y como son para un recuerdo fiel de ese momento.",
    image: "/styles/realista.svg",
    accent: "#7e9e8a",
  },
  {
    id: "caricatura",
    name: "Caricatura",
    tagline: "Divertido y expresivo",
    description:
      "Cabezas grandes, gestos exagerados y mucha personalidad. El estilo más simpático y lleno de carácter.",
    image: "/styles/caricatura.svg",
    accent: "#d98c5f",
  },
];

export const VARIANTS: Variant[] = [
  {
    id: "individual",
    name: "Figura individual",
    description: "Una persona o mascota en tu figura personalizada.",
    priceCents: 2900,
    height: "Hasta 15 cm de alto",
  },
  {
    id: "pareja",
    name: "Pareja / dúo",
    description: "Dos personajes juntos en la misma base.",
    priceCents: 4900,
    height: "Hasta 15 cm de alto",
  },
  {
    id: "familia",
    name: "Grupo / familia",
    description: "Hasta cuatro personajes en una escena compartida.",
    priceCents: 7900,
    height: "Hasta 18 cm de alto",
  },
];

export const SHIPPING = {
  flatCents: 499,
  freeThresholdCents: 5500,
  label: "Envío estándar",
};

export function styleById(id: string): FigureStyle | undefined {
  return STYLES.find((s) => s.id === id);
}

export function variantById(id: string): Variant | undefined {
  return VARIANTS.find((v) => v.id === id);
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
