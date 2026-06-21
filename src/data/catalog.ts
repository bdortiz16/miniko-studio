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
  // Precio en pesos colombianos (COP), sin decimales. EDITA AQUÍ tus precios.
  priceCop: number;
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

// ─── PRECIOS (en pesos colombianos, COP) ──────────────────────────
// Cambia "priceCop" por tus precios reales. 1 personaje, pareja, y grupos.
export const VARIANTS: Variant[] = [
  {
    id: "individual",
    name: "1 personaje",
    description: "Una persona o mascota.",
    priceCop: 119000,
    height: "Hasta 15 cm de alto",
    people: 1,
  },
  {
    id: "pareja",
    name: "2 personajes (combo)",
    description: "Pareja o dúo en la misma base.",
    priceCop: 199000,
    height: "Hasta 15 cm de alto",
    people: 2,
  },
  {
    id: "trio",
    name: "3 personajes",
    description: "Tres personajes en una escena.",
    priceCop: 269000,
    height: "Hasta 18 cm de alto",
    people: 3,
  },
  {
    id: "familia4",
    name: "4 personajes",
    description: "Cuatro personajes en una escena.",
    priceCop: 329000,
    height: "Hasta 18 cm de alto",
    people: 4,
  },
  {
    id: "grupo5",
    name: "5 personajes",
    description: "Cinco personajes en una escena.",
    priceCop: 389000,
    height: "Hasta 20 cm de alto",
    people: 5,
  },
  {
    id: "grupo6",
    name: "6 personajes",
    description: "Seis personajes en una escena.",
    priceCop: 439000,
    height: "Hasta 20 cm de alto",
    people: 6,
  },
];

export const SHIPPING = {
  // Costo de envío plano (COP) y a partir de cuántos personajes es GRATIS.
  flatCop: 12000,
  freeFromPeople: 3, // envío gratis desde 3 personajes
  label: "Envío estándar",
};

// Costo de envío en COP según el nº de personajes.
export function shippingCop(people: number): number {
  return people >= SHIPPING.freeFromPeople ? 0 : SHIPPING.flatCop;
}

// ─── MASCOTAS ──────────────────────────────────────────────────────
// Figuras de ejemplo de mascotas (se generan con IA desde el panel admin y se
// guardan en Supabase: mascots/<id>.png). Si no hay imagen, se cae al emoji.
const MASCOTS_V = "1";
function mascotImage(id: string): string {
  return SUPA_URL
    ? `${SUPA_URL}/storage/v1/object/public/pedidos/mascots/${id}.png?v=${MASCOTS_V}`
    : "";
}

export interface Mascot {
  id: string;
  label: string; // "Perro", "Gato"…
  styleId: StyleId; // estilo con el que se muestra y se pide
  styleName: string; // "Funko Pop", "Disney", "Realista"
  emoji: string; // fallback si no hay imagen generada
  image: string;
}

export const MASCOTS: Mascot[] = [
  { id: "dog", label: "Perro", styleId: "kawaii", styleName: "Funko Pop", emoji: "🐶", image: mascotImage("dog") },
  { id: "cat", label: "Gato", styleId: "caricatura", styleName: "Disney", emoji: "🐱", image: mascotImage("cat") },
  { id: "dogreal", label: "Perro", styleId: "realista", styleName: "Realista", emoji: "🐶", image: mascotImage("dogreal") },
];

export function styleById(id: string): FigureStyle | undefined {
  return STYLES.find((s) => s.id === id);
}

export function variantById(id: string): Variant | undefined {
  return VARIANTS.find((v) => v.id === id);
}

export function formatCop(cop: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cop);
}
