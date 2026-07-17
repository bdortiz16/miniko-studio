import { NextResponse } from "next/server";
import { variantById, styleById } from "@/data/catalog";
import { getSettings, priceOf, shipOf } from "@/lib/settings";
import { buildCheckoutUrl, getSiteUrl, wompiConfigured } from "@/lib/wompi";
import { saveOrder, Order } from "@/lib/orders";
import { findValidCoupon } from "@/lib/coupons";
import { getProduct } from "@/lib/products";

// Dominio real de ESTA petición. Evita que redirect-url quede como
// http://localhost:3000 (que el firewall de Wompi bloquea con 403).
function originFromRequest(request: Request): string {
  const h = request.headers;
  const origin = h.get("origin");
  if (origin && !origin.includes("localhost")) return origin;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host && !host.includes("localhost")) return `${proto}://${host}`;
  return getSiteUrl();
}

interface OrderPayload {
  styleId: string;
  variantId: string;
  email?: string;
  tipo?: string;
  personas?: number;
  mascotas?: number;
  composicion?: string;
  coupon?: string;
  extras?: { productId: string; qty?: number; designId?: string; customText?: string }[]; // productos adicionales (upsell)
  photoUrls?: string[];
  previewUrls?: string[];
  shipping?: {
    name?: string;
    phone?: string;
    address?: string;
    reference?: string;
    city?: string;
    department?: string;
    zip?: string;
    country?: string;
  };
}

export async function POST(request: Request) {
  if (!wompiConfigured()) {
    return NextResponse.json(
      {
        error:
          "Wompi no está configurado. Añade NEXT_PUBLIC_WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET.",
      },
      { status: 500 }
    );
  }

  let body: OrderPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const variant = variantById(body.variantId);
  const style = styleById(body.styleId);
  if (!variant || !style) {
    return NextResponse.json({ error: "Producto no válido." }, { status: 400 });
  }

  // Precios y envío vienen de la configuración editable del panel admin.
  const settings = await getSettings();
  const priceCop = priceOf(settings, variant.id, variant.priceCop);
  const shippingCop = shipOf(settings, variant.people);

  // Cupón: se valida en el servidor (no se confía en el cliente). El descuento
  // se aplica solo sobre el precio del producto, no sobre el envío.
  let couponCode: string | undefined;
  let discountCents = 0;
  if (body.coupon) {
    const c = await findValidCoupon(body.coupon);
    if (c) {
      couponCode = c.code;
      discountCents = Math.round(priceCop * (c.percent / 100)) * 100;
    }
  }
  // Extras (upsell): productos adicionales de la tienda. Precio recalculado
  // en el servidor (no se confía en el cliente).
  const extraItems: NonNullable<Order["items"]> = [];
  let extrasCents = 0;
  for (const e of body.extras ?? []) {
    const product = await getProduct(e.productId);
    if (!product || !product.active) continue;
    const qty = Math.min(20, Math.max(1, Math.floor(e.qty || 1)));
    const design = product.designs?.find((d) => d.id === e.designId);
    const unitCop = product.priceCop + (design?.extraCop || 0);
    const customText = (e.customText || "").trim().slice(0, 80) || undefined;
    extrasCents += unitCop * qty * 100;
    extraItems.push({ productId: product.id, name: product.name, design: design?.name, customText, qty, unitCop });
  }

  // Wompi usa centavos: COP x100.
  const amountInCents = Math.max(100, (priceCop + shippingCop) * 100 - discountCents + extrasCents);

  const reference = `miniko-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const photoUrls = (body.photoUrls ?? []).slice(0, 8);
  const s = body.shipping ?? {};

  const order: Order = {
    reference,
    status: "PENDING",
    createdAt: Math.floor(Date.now() / 1000),
    email: body.email || "",
    amount: amountInCents,
    currency: "COP",
    coupon: couponCode,
    discount: discountCents || undefined,
    styleId: style.id,
    estilo: style.name,
    composicion: body.composicion || variant.name,
    tipo: body.tipo || "Persona",
    personas: body.personas ?? variant.people,
    mascotas: body.mascotas ?? 0,
    photoUrls,
    previewUrls: (body.previewUrls ?? []).filter((u) => u && !u.startsWith("data:")).slice(0, 8),
    items: extraItems.length ? extraItems : undefined,
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
    const message = err instanceof Error ? err.message : "No se pudo guardar el pedido.";
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
