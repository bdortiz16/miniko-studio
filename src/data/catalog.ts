// Catálogo de Miniko Studio.
// Las imágenes son placeholders (SVG en /public/styles). Sustitúyelas por tus
// fotos reales cuando las tengas, manteniendo el mismo nombre de archivo o
// actualizando la ruta "image" de cada estilo.

export type StyleId = "kawaii" | "realista" | "caricatura";

// Las imágenes de ejemplo de cada estilo se generan con IA (ruta
// /api/generate-style-samples) y se guardan en Supabase. Si Supabase está
// configurado usamos esa imagen; si no, caemos al placeholder SVG local.
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Versión para invalidar la caché del navegador. Súbela si alguna vez ves
// imágenes viejas tras regenerar (las muestras se sirven con no-cache, pero
// esto fuerza a soltar cualquier copia antigua ya guardada).
const SAMPLES_V = "5";
function styleImage(id: StyleId, fallback: string): string {
  return SUPA_URL
    ? `${SUPA_URL}/storage/v1/object/public/pedidos/samples/${id}.png?v=${SAMPLES_V}`
    : fallback;
}

export interface FigureStyle {
  id: StyleId;
  name: string;
  tagline: string;
  description: string;
  image: string; // ruta dentro de /public
  accent: string; // color de acento (tailwind hex)
  premium?: boolean;
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  // Precio en céntimos de euro (Stripe trabaja con la menor unidad).
  priceCents: number;
  height: string;
  people: number; // nº de personas/mascotas incluidas
}

export const STYLES: FigureStyle[] = [
  {
    id: "kawaii",
    name: "Funko Pop",
    tagline: "Cabezón y adorable",
    description:
      "Cabeza grande, cuerpo pequeño y esos ojos negros tan característicos. El estilo coleccionable más reconocible y divertido.",
    image: styleImage("kawaii", "/styles/kawaii.svg"),
    accent: "#e89ab0",
  },
  {
    id: "caricatura",
    name: "Disney",
    tagline: "Estilo animación",
    description:
      "Acabado 3D tipo película de animación: gestos expresivos, mirada simpática y mucho encanto. Como sacado de tu peli favorita.",
    image: styleImage("caricatura", "/styles/caricatura.svg"),
    accent: "#d98c5f",
  },
  {
    id: "realista",
    name: "Realista",
    tagline: "Fiel a la foto",
    description:
      "Detalle y proporciones realistas. Capturamos los rasgos tal y como son para un recuerdo fiel de ese momento.",
    image: styleImage("realista", "/styles/realista.svg"),
    accent: "#7e9e8a",
    premium: true,
  },
];

export const VARIANTS: Variant[] = [
  {
    id: "individual",
    name: "Figura individual",
    description: "Una persona o mascota en tu figura personalizada.",
    priceCents: 2900,
    height: "Hasta 15 cm de alto",
    people: 1,
  },
  {
    id: "pareja",
    name: "Pareja / dúo",
    description: "Dos personajes juntos en la misma base.",
    priceCents: 4900,
    height: "Hasta 15 cm de alto",
    people: 2,
  },
  {
    id: "familia",
    name: "Grupo / familia",
    description: "Hasta cuatro personajes en una escena compartida.",
    priceCents: 7900,
    height: "Hasta 18 cm de alto",
    people: 4,
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
