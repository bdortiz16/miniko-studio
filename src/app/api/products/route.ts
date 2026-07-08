import { NextResponse } from "next/server";
import { listProducts, DEFAULT_PRODUCTS } from "@/lib/products";

// Productos activos para la Tienda pública. Si aún no has creado ninguno,
// mostramos el catálogo de ejemplo para que la tienda no se vea vacía.
export async function GET() {
  const stored = await listProducts();
  const products = stored.length > 0 ? stored.filter((p) => p.active) : DEFAULT_PRODUCTS;
  return NextResponse.json({ products });
}
