import { NextResponse } from "next/server";
import { stripe, getSiteUrl } from "@/lib/stripe";
import { variantById, styleById, SHIPPING } from "@/data/catalog";
import { getSettings, priceOf, shipOf } from "@/lib/settings";

interface OrderPayload {
  styleId: string;
  variantId: string;
  email?: string;
  tipo?: string; // "mascota" | "persona"
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
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe no está configurado. Añade STRIPE_SECRET_KEY a tu archivo .env.local.",
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
  // Stripe usa la unidad menor: COP tiene 2 decimales en Stripe => x100.
  const unitAmount = priceOf(settings, variant.id, variant.priceCop) * 100;
  const shippingAmount = shipOf(settings, variant.people) * 100;

  const photoUrls = (body.photoUrls ?? []).slice(0, 6);
  const s = body.shipping ?? {};

  // Metadatos: todo lo que el negocio necesita para preparar el pedido.
  const metadata: Record<string, string> = {
    tipo: body.tipo === "mascota" ? "Mascota" : "Persona",
    estilo: style.name,
    tamano: variant.name,
    personas: String(variant.people),
    envio_nombre: s.name ?? "",
    envio_direccion: [s.address, s.city, s.zip, s.country].filter(Boolean).join(", "),
  };
  photoUrls.forEach((url, i) => {
    metadata[`foto_${i + 1}`] = url.slice(0, 480);
  });
  if (body.previewUrl && !body.previewUrl.startsWith("data:")) {
    metadata.figura_ia = body.previewUrl.slice(0, 480);
  }

  const siteUrl = getSiteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cop",
            unit_amount: unitAmount,
            product_data: {
              name: `Figura ${style.name} — ${variant.name}`,
              description: variant.description,
            },
          },
        },
      ],
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shippingAmount === 0 ? "Envío gratis" : SHIPPING.label,
            fixed_amount: { amount: shippingAmount, currency: "cop" },
          },
        },
      ],
      metadata,
      success_url: `${siteUrl}/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pedido`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la sesión.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
