import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";

// Detalle público de un producto (incluye ejemplos del catálogo demo).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ product });
}
