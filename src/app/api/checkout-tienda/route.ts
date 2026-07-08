import { NextResponse } from "next/server";
import { getSettings, tiendaShipOf } from "@/lib/settings";
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

interface CartLine {
  productId: string;
  qty?: number;
  designId?: string;
  customText?: string;
}

interface TiendaPayload {
  // Compra de un solo producto (compatibilidad) o carrito completo.
  productId?: string;
  qty?: number;
  designId?: string;
  customText?: string;
  items?: CartLine[];
  email?: string;
  shipping?: {
    name?: string; phone?: string; address?: string; reference?: string;
    city?: string; department?: string; zip?: string; country?: string;
  };
}

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

  const lines: CartLine[] = body.items?.length
    ? body.items
    : body.productId
    ? [{ productId: body.productId, qty: body.qty, designId: body.designId, customText: body.customText }]
    : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  const orderItems: NonNullable<Order["items"]> = [];
  let productsCents = 0;

  for (const line of lines) {
    const product = await getProduct(line.productId);
    if (!product || !product.active) {
      return NextResponse.json({ error: "Un producto ya no está disponible." }, { status: 400 });
    }
    const qty = Math.min(20, Math.max(1, Math.floor(line.qty || 1)));
    const design = product.designs?.find((d) => d.id === line.designId);
    if (product.designs && product.designs.length > 0 && !design) {
      return NextResponse.json({ error: `Elige un diseño para ${product.name}.` }, { status: 400 });
    }
    const customText = (line.customText || "").trim().slice(0, 80);
    if (design?.customLabel && !customText) {
      return NextResponse.json({ error: `Falta "${design.customLabel}" en ${product.name}.` }, { status: 400 });
    }
    const unitCop = product.priceCop + (design?.extraCop || 0);
    productsCents += unitCop * qty * 100;
    orderItems.push({
      productId: product.id,
      name: product.name,
      design: design?.name,
      customText: customText || undefined,
      qty,
      unitCop,
    });
  }

  const settings = await getSettings();
  const shippingCop = tiendaShipOf(settings);
  const amountInCents = Math.max(100, productsCents + shippingCop * 100);

  // Descripción legible del pedido.
  const totalUnits = orderItems.reduce((n, it) => n + it.qty, 0);
  const composicion =
    orderItems.length === 1
      ? [`${orderItems[0].qty} und`, orderItems[0].design, orderItems[0].customText ? `"${orderItems[0].customText}"` : ""]
          .filter(Boolean)
          .join(" · ")
      : `${orderItems.length} productos · ${totalUnits} und`;
  const estilo = orderItems.length === 1 ? orderItems[0].name : "Compra de tienda";
  const firstProduct = await getProduct(orderItems[0].productId);

  const reference = `miniko-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const s = body.shipping ?? {};

  const order: Order = {
    reference,
    status: "PENDING",
    createdAt: Math.floor(Date.now() / 1000),
    email: body.email || "",
    amount: amountInCents,
    currency: "COP",
    styleId: "tienda",
    estilo,
    composicion,
    tipo: "Tienda",
    personas: 0,
    mascotas: 0,
    photoUrls: firstProduct?.image ? [firstProduct.image] : [],
    previewUrls: [],
    items: orderItems,
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
