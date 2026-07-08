import { NextResponse } from "next/server";
import { getSettings, shipOf } from "@/lib/settings";
import { buildCheckoutUrl, getSiteUrl, wompiConfigured } from "@/lib/wompi";
import { saveOrder, Order } from "@/lib/orders";
import { getProduct } from "@/lib/products";

function originFromRequest(request: Request): string {
  const h = request.headers;
  const origin = h.get("origin");
  if (origin && !origin.includes("localhost")) return origin;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host && !host.includes("localhost")) return `${proto}://${host}`;
  return getSiteUrl();
}

interface TiendaPayload {
  productId: string;
  qty?: number;
  designId?: string;
  customText?: string;
  email?: string;
  shipping?: {
    name?: string; phone?: string; address?: string; reference?: string;
    city?: string; department?: string; zip?: string; country?: string;
  };
}

// Compra de un producto de la Tienda. Reutiliza el modelo de pedido y Wompi.
export async function POST(request: Request) {
  if (!wompiConfigured()) {
    return NextResponse.json({ error: "Wompi no está configurado." }, { status: 500 });
  }

  let body: TiendaPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const product = await getProduct(body.productId);
  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no disponible." }, { status: 400 });
  }

  const qty = Math.min(20, Math.max(1, Math.floor(body.qty || 1)));

  // Diseño elegido (si el producto tiene diseños). Valida contra el producto.
  const design = product.designs?.find((d) => d.id === body.designId);
  if (product.designs && product.designs.length > 0 && !design) {
    return NextResponse.json({ error: "Elige un diseño." }, { status: 400 });
  }
  const customText = (body.customText || "").trim().slice(0, 80);
  if (design?.customLabel && !customText) {
    return NextResponse.json({ error: `Falta: ${design.customLabel}.` }, { status: 400 });
  }
  const unitCop = product.priceCop + (design?.extraCop || 0);

  const settings = await getSettings();
  // Envío: usa la tarifa de 1 figura como base para artículos de la tienda.
  const shippingCop = shipOf(settings, 1);
  const amountInCents = Math.max(100, (unitCop * qty + shippingCop) * 100);

  // Descripción legible del pedido: diseño + dato personalizado.
  const parts = [`${qty} und`];
  if (design) parts.push(design.name);
  if (customText) parts.push(`"${customText}"`);
  const composicion = parts.join(" · ");

  const reference = `miniko-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const s = body.shipping ?? {};

  const order: Order = {
    reference,
    status: "PENDING",
    createdAt: Math.floor(Date.now() / 1000),
    email: body.email || "",
    amount: amountInCents,
    currency: "COP",
    styleId: `tienda-${product.id}`,
    estilo: product.name,
    composicion,
    tipo: "Tienda",
    personas: 0,
    mascotas: 0,
    photoUrls: product.image ? [product.image] : [],
    previewUrls: [],
    shipping: {
      name: s.name,
      phone: s.phone,
      address: s.address,
      reference: s.reference,
      city: s.city,
      department: s.department,
      zip: s.zip,
      country: s.country,
    },
  };

  try {
    await saveOrder(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo guardar la compra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const url = buildCheckoutUrl({
    reference,
    amountInCents,
    redirectUrl: `${originFromRequest(request)}/exito`,
    customerEmail: body.email || undefined,
  });

  return NextResponse.json({ url });
}
