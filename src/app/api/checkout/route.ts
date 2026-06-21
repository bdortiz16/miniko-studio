import { NextResponse } from "next/server";
import { variantById, styleById } from "@/data/catalog";
import { getSettings, priceOf, shipOf } from "@/lib/settings";
import { buildCheckoutUrl, getSiteUrl, wompiConfigured } from "@/lib/wompi";
import { saveOrder, Order } from "@/lib/orders";

interface OrderPayload {
  styleId: string;
  variantId: string;
  email?: string;
  tipo?: string;
  personas?: number;
  mascotas?: number;
  composicion?: string;
  photoUrls?: string[];
  previewUrl?: string | null;
  shipping?: {
    name?: string;
    address?: string;
    city?: string;
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
    previewUrl: body.previewUrl && !body.previewUrl.startsWith("data:") ? body.previewUrl : null,
    shipping: {
      name: s.name,
      address: s.address,
      city: s.city,
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
    redirectUrl: `${getSiteUrl()}/exito`,
    customerEmail: body.email || undefined,
  });

  return NextResponse.json({ url });
}
