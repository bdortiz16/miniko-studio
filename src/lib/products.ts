import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Productos de la Tienda (llaveros y otros artículos 3D). Se guardan en
// Supabase (config/products.json). El precio está en pesos (no centavos).
// Un diseño/variante dentro de un producto (ej. en un llavero: "Nombre",
// "Perrito", "Logo marca"). Puede pedir un dato al cliente (customLabel) y
// costar un extra sobre el precio base (extraCop).
export interface Design {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  extraCop?: number;
  customLabel?: string; // si tiene valor, pide un texto (ej. "Nombre a grabar")
}

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  image: string; // URL pública de Supabase (imagen principal)
  images?: string[]; // galería de fotos adicionales
  category?: string; // categoría (llaveros, hogar…) para filtrar/buscar
  active: boolean;
  stock?: number; // opcional; si es undefined, sin control de stock
  emoji?: string; // visual cuando no hay imagen (catálogo de ejemplo)
  accent?: string; // color de fondo del cuadro cuando no hay imagen
  designs?: Design[]; // sub-catálogo de diseños personalizables
  nfc?: boolean; // es placa NFC: genera la página de mascota al comprarla
  createdAt: number;
}

// Categorías sugeridas para la Tienda.
export const PRODUCT_CATEGORIES = [
  "Llaveros",
  "Hogar",
  "Escritorio",
  "Mascotas",
  "Fiestas",
  "Decoración",
  "Otros",
];

// Ajusta el stock de un producto tras una venta (si maneja stock).
export async function decrementStock(items: { productId: string; qty: number }[]): Promise<void> {
  const list = await listProducts();
  let changed = false;
  for (const it of items) {
    const p = list.find((x) => x.id === it.productId);
    if (p && typeof p.stock === "number") {
      p.stock = Math.max(0, p.stock - Math.max(1, it.qty));
      changed = true;
    }
  }
  if (changed) await saveProducts(list);
}

const PATH = "config/products.json";

// Catálogo de ejemplo (se muestra en /tienda mientras no crees tus propios
// productos). Puedes cargarlos al panel con "Cargar ejemplos" para editarlos.
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "demo-llavero-nombre", name: "Llavero personalizado", category: "Llaveros", description: "Elige un diseño y personalízalo. Impreso en 3D.", priceCop: 12000, image: "", active: true, emoji: "🔑", accent: "#FDE68A", createdAt: 0,
    designs: [
      { id: "nombre", name: "Nombre", emoji: "🔤", customLabel: "Nombre a grabar" },
      { id: "inicial", name: "Inicial", emoji: "🅰️", customLabel: "Letra o inicial" },
      { id: "marca", name: "Logo / marca", emoji: "™️", extraCop: 3000, customLabel: "Marca o texto del logo" },
      { id: "corazon", name: "Corazón", emoji: "❤️" },
      { id: "estrella", name: "Estrella", emoji: "⭐" },
      { id: "carro", name: "Carrito", emoji: "🚗" },
    ],
  },
  {
    id: "demo-llavero-mascota", name: "Llavero de tu mascota", category: "Mascotas", description: "El animalito que quieras, con su nombre.", priceCop: 15000, image: "", active: true, emoji: "🐾", accent: "#FBCFE8", createdAt: 0,
    designs: [
      { id: "perro", name: "Perro", emoji: "🐶", customLabel: "Nombre de la mascota" },
      { id: "gato", name: "Gato", emoji: "🐱", customLabel: "Nombre de la mascota" },
      { id: "conejo", name: "Conejo", emoji: "🐰", customLabel: "Nombre de la mascota" },
      { id: "ave", name: "Ave", emoji: "🐦", customLabel: "Nombre de la mascota" },
      { id: "huella", name: "Huella", emoji: "🐾" },
    ],
  },
  {
    id: "demo-maceta", name: "Maceta decorativa", category: "Hogar", description: "Maceta geométrica para suculentas y cactus.", priceCop: 28000, image: "", active: true, emoji: "🪴", accent: "#BBF7D0", createdAt: 0,
    designs: [
      { id: "blanco", name: "Blanco", emoji: "⚪" },
      { id: "negro", name: "Negro", emoji: "⚫" },
      { id: "terracota", name: "Terracota", emoji: "🟠" },
      { id: "pastel", name: "Pastel", emoji: "🩷" },
    ],
  },
  {
    id: "demo-iman", name: "Imán de nevera", category: "Decoración", description: "Detalle personalizado para la nevera.", priceCop: 9000, image: "", active: true, emoji: "🧲", accent: "#FED7AA", createdAt: 0,
    designs: [
      { id: "nombre", name: "Nombre", emoji: "🔤", customLabel: "Texto del imán" },
      { id: "frase", name: "Frase", emoji: "💬", customLabel: "Frase" },
      { id: "animal", name: "Animalito", emoji: "🐢" },
    ],
  },
  {
    id: "demo-topper", name: "Topper para torta", category: "Fiestas", description: "Decora tu torta con nombres y figuras 3D.", priceCop: 18000, image: "", active: true, emoji: "🎂", accent: "#FECACA", createdAt: 0,
    designs: [
      { id: "nombre-edad", name: "Nombre + edad", emoji: "🎂", customLabel: "Nombre y edad (ej. Sofía 5)" },
      { id: "tematico", name: "Temático", emoji: "🎉", extraCop: 4000, customLabel: "Tema (ej. fútbol, unicornio)" },
      { id: "feliz-cumple", name: "Feliz cumpleaños", emoji: "🥳" },
    ],
  },
  {
    id: "demo-placa-nfc", name: "Placa NFC para mascota", category: "Mascotas", description: "Placa 3D con el nombre de tu mascota + chip NFC y QR. Si se pierde, quien la encuentre escanea y ve tu contacto. Actívala en miniko.com.co/nfc.", priceCop: 35000, image: "", active: true, emoji: "🦴", accent: "#FDE68A", nfc: true, createdAt: 0,
    designs: [
      { id: "hueso", name: "Hueso", emoji: "🦴", customLabel: "Nombre de la mascota" },
      { id: "nube", name: "Nube", emoji: "☁️", customLabel: "Nombre de la mascota" },
      { id: "estrella", name: "Estrella", emoji: "⭐", customLabel: "Nombre de la mascota" },
      { id: "corazon", name: "Corazón", emoji: "❤️", customLabel: "Nombre de la mascota" },
      { id: "flor", name: "Flor", emoji: "🌸", customLabel: "Nombre de la mascota" },
      { id: "rayo", name: "Rayo", emoji: "⚡", customLabel: "Nombre de la mascota" },
    ],
  },
  { id: "demo-soporte-celular", name: "Soporte para celular", category: "Escritorio", description: "Base de escritorio estable para tu teléfono.", priceCop: 22000, image: "", active: true, emoji: "📱", accent: "#BFDBFE", createdAt: 0 },
  { id: "demo-portalapices", name: "Portalápices", category: "Escritorio", description: "Organiza tu escritorio con estilo.", priceCop: 20000, image: "", active: true, emoji: "✏️", accent: "#DDD6FE", createdAt: 0 },
  { id: "demo-posavasos", name: "Posavasos (juego x4)", category: "Hogar", description: "Set de 4 posavasos resistentes impresos en 3D.", priceCop: 24000, image: "", active: true, emoji: "🥤", accent: "#A5F3FC", createdAt: 0 },
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
