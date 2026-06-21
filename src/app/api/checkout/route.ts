import { NextResponse } from "next/server";
import { stripe, getSiteUrl } from "@/lib/stripe";
import { variantById, styleById, SHIPPING } from "@/data/catalog";

interface IncomingItem {
  styleId: string;
  variantId: string;
  quantity: number;
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

  let body: { items?: IncomingItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const items = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] =
    [];
  let subtotalCents = 0;

  for (const item of items) {
    const variant = variantById(item.variantId);
    const style = styleById(item.styleId);
    const qty = Math.max(1, Math.min(20, Math.floor(item.quantity || 1)));
    if (!variant || !style) {
      return NextResponse.json(
        { error: `Producto no válido: ${item.styleId}/${item.variantId}` },
        { status: 400 }
      );
    }
    subtotalCents += variant.priceCents * qty;
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "eur",
        unit_amount: variant.priceCents,
        product_data: {
          name: `Figura ${style.name} — ${variant.name}`,
          description: variant.description,
        },
      },
    });
  }

  const shippingCents =
    subtotalCents >= SHIPPING.freeThresholdCents ? 0 : SHIPPING.flatCents;

  const siteUrl = getSiteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["ES", "DE", "FR", "IT", "PT", "NL", "BE", "AT"],
      },
      shipping_options:
        shippingCents === 0
          ? [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  display_name: "Envío gratis",
                  fixed_amount: { amount: 0, currency: "eur" },
                },
              },
            ]
          : [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  display_name: SHIPPING.label,
                  fixed_amount: { amount: shippingCents, currency: "eur" },
                },
              },
            ],
      success_url: `${siteUrl}/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/carrito`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la sesión.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
