import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Productos de la Tienda (llaveros y otros artículos 3D). Se guardan en
// Supabase (config/products.json). El precio está en pesos (no centavos).
export interface Product {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  image: string; // URL pública de Supabase
  active: boolean;
  stock?: number; // opcional; si es undefined, sin control de stock
  emoji?: string; // visual cuando no hay imagen (catálogo de ejemplo)
  accent?: string; // color de fondo del cuadro cuando no hay imagen
  createdAt: number;
}

const PATH = "config/products.json";

// Catálogo de ejemplo (se muestra en /tienda mientras no crees tus propios
// productos). Puedes cargarlos al panel con "Cargar ejemplos" para editarlos.
export const DEFAULT_PRODUCTS: Product[] = [
  { id: "demo-llavero-nombre", name: "Llavero personalizado", description: "Con el nombre o la forma que quieras, impreso en 3D.", priceCop: 12000, image: "", active: true, emoji: "🔑", accent: "#FDE68A", createdAt: 0 },
  { id: "demo-llavero-mascota", name: "Llavero de tu mascota", description: "La silueta de tu perro o gato en un llavero.", priceCop: 15000, image: "", active: true, emoji: "🐾", accent: "#FBCFE8", createdAt: 0 },
  { id: "demo-soporte-celular", name: "Soporte para celular", description: "Base de escritorio estable para tu teléfono.", priceCop: 22000, image: "", active: true, emoji: "📱", accent: "#BFDBFE", createdAt: 0 },
  { id: "demo-maceta", name: "Maceta decorativa", description: "Maceta geométrica para suculentas y cactus.", priceCop: 28000, image: "", active: true, emoji: "🪴", accent: "#BBF7D0", createdAt: 0 },
  { id: "demo-portalapices", name: "Portalápices", description: "Organiza tu escritorio con estilo.", priceCop: 20000, image: "", active: true, emoji: "✏️", accent: "#DDD6FE", createdAt: 0 },
  { id: "demo-iman", name: "Imán de nevera", description: "Detalle personalizado para la nevera.", priceCop: 9000, image: "", active: true, emoji: "🧲", accent: "#FED7AA", createdAt: 0 },
  { id: "demo-topper", name: "Topper para torta", description: "Decora tu torta con nombres y figuras 3D.", priceCop: 18000, image: "", active: true, emoji: "🎂", accent: "#FECACA", createdAt: 0 },
  { id: "demo-posavasos", name: "Posavasos (juego x4)", description: "Set de 4 posavasos resistentes impresos en 3D.", priceCop: 24000, image: "", active: true, emoji: "🥤", accent: "#A5F3FC", createdAt: 0 },
];

export async function listProducts(): Promise<Product[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).download(PATH);
  if (error || !data) return [];
  try {
    const arr = JSON.parse(await data.text());
    return Array.isArray(arr) ? (arr as Product[]) : [];
  } catch {
    return [];
  }
}

export async function saveProducts(list: Product[]): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase no configurado.");
  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(PATH, Buffer.from(JSON.stringify(list, null, 2)), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

export async function getProduct(id: string): Promise<Product | null> {
  const stored = (await listProducts()).find((p) => p.id === id);
  if (stored) return stored;
  // Permite comprar también los productos del catálogo de ejemplo.
  return DEFAULT_PRODUCTS.find((p) => p.id === id) || null;
}
