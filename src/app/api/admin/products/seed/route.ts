import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listProducts, saveProducts, DEFAULT_PRODUCTS, Product } from "@/lib/products";

// Carga el catálogo de ejemplo en la tienda (para editarlo). Solo agrega los
// que falten, no duplica ni borra los que ya tengas.
export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const existing = await listProducts();
  const have = new Set(existing.map((p) => p.id));
  const now = Math.floor(Date.now() / 1000);
  const toAdd: Product[] = DEFAULT_PRODUCTS.filter((p) => !have.has(p.id)).map((p) => ({
    ...p,
    createdAt: now,
  }));
  const list = [...toAdd, ...existing];
  await saveProducts(list);
  return NextResponse.json({ products: list, added: toAdd.length });
}
