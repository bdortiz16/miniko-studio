import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listProducts, saveProducts, Product, Design } from "@/lib/products";

// Limpia y normaliza los diseños que llegan del panel.
function cleanDesigns(raw: unknown): Design[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = raw
    .map((d): Design | null => {
      const o = d as Partial<Design>;
      const name = (o.name || "").trim();
      if (!name) return null;
      return {
        id: o.id || `d-${Math.random().toString(36).slice(2, 8)}`,
        name,
        emoji: (o.emoji || "").trim() || undefined,
        image: o.image || undefined,
        extraCop: o.extraCop ? Math.max(0, Math.round(Number(o.extraCop))) : undefined,
        customLabel: (o.customLabel || "").trim() || undefined,
      };
    })
    .filter((d): d is Design => d !== null);
  return list.length ? list : undefined;
}

// Gestión de productos de la Tienda (solo admin).
export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ products: await listProducts() });
}

// Crea o actualiza un producto.
export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  let body: Partial<Product>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const priceCop = Math.round(Number(body.priceCop) || 0);
  if (!name || priceCop <= 0) {
    return NextResponse.json({ error: "Falta el nombre o el precio." }, { status: 400 });
  }

  const list = await listProducts();
  const now = Math.floor(Date.now() / 1000);

  if (body.id) {
    const idx = list.findIndex((p) => p.id === body.id);
    if (idx < 0) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    list[idx] = {
      ...list[idx],
      name,
      description: (body.description || "").trim(),
      priceCop,
      image: body.image || list[idx].image,
      active: body.active !== false,
      stock: typeof body.stock === "number" ? body.stock : list[idx].stock,
      designs: cleanDesigns(body.designs),
    };
    await saveProducts(list);
    return NextResponse.json({ product: list[idx] });
  }

  const product: Product = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: (body.description || "").trim(),
    priceCop,
    image: body.image || "",
    active: body.active !== false,
    stock: typeof body.stock === "number" ? body.stock : undefined,
    designs: cleanDesigns(body.designs),
    createdAt: now,
  };
  list.unshift(product);
  await saveProducts(list);
  return NextResponse.json({ product });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  const list = await listProducts();
  await saveProducts(list.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
