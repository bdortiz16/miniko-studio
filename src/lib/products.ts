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
  createdAt: number;
}

const PATH = "config/products.json";

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
  return (await listProducts()).find((p) => p.id === id) || null;
}
