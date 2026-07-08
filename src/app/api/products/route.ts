import { NextResponse } from "next/server";
import { listProducts } from "@/lib/products";

// Productos activos para la Tienda pública.
export async function GET() {
  const products = (await listProducts()).filter((p) => p.active);
  return NextResponse.json({ products });
}
