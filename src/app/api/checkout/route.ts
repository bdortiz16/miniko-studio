import { NextResponse } from "next/server";
import { variantById, styleById } from "@/data/catalog";
import { getSettings, priceOf, shipOf } from "@/lib/settings";
import { buildCheckoutUrl, getSiteUrl, wompiConfigured } from "@/lib/wompi";
import { saveOrder, Order } from "@/lib/orders";

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
  // Wompi usa centavos: COP x100.
  const amountInCents = (priceCop + shippingCop) * 100;

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
    styleId: style.id,
    estilo: style.name,
    composicion: body.composicion || variant.name,
    tipo: body.tipo || "Persona",
    personas: body.personas ?? variant.people,
    mascotas: body.mascotas ?? 0,
    photoUrls,
    previewUrls: (body.previewUrls ?? []).filter((u) => u && !u.startsWith("data:")).slice(0, 8),
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
