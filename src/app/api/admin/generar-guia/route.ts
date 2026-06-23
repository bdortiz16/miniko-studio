import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getOrder, updateOrderFulfillment } from "@/lib/orders";
import { enviaConfigured, generateBestGuide, Address } from "@/lib/envia";

// Genera la guía de envío con Envia.com para un pedido y guarda el número de
// guía + la URL de la etiqueta. El admin completa teléfono/departamento si faltan.
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!enviaConfigured()) {
    return NextResponse.json(
      { error: "Envia.com no está configurado (falta ENVIA_API_TOKEN en Vercel)." },
      { status: 500 }
    );
  }

  let body: {
    reference?: string;
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!body.reference) {
    return NextResponse.json({ error: "Falta la referencia del pedido." }, { status: 400 });
  }
  const order = await getOrder(body.reference);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  // Destino: datos del pedido completados con lo que el admin haya ingresado.
  const destination: Address = {
    name: (body.name || order.shipping?.name || "").trim(),
    phone: (body.phone || "").trim(),
    street: (body.street || order.shipping?.address || "").trim(),
    city: (body.city || order.shipping?.city || "").trim(),
    state: (body.state || "").trim(),
    country: "CO",
    postalCode: (body.postalCode || order.shipping?.zip || "").trim() || undefined,
  };

  const missing: string[] = [];
  if (!destination.name) missing.push("nombre");
  if (!destination.phone) missing.push("teléfono");
  if (!destination.street) missing.push("dirección");
  if (!destination.city) missing.push("ciudad");
  if (!destination.state) missing.push("departamento");
  if (missing.length) {
    return NextResponse.json(
      { error: `Faltan datos del destinatario: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const declaredValue = Math.round((order.amount || 0) / 100); // COP (centavos -> pesos)
    const guide = await generateBestGuide(destination, declaredValue);
    await updateOrderFulfillment(order.reference, {
      carrier: guide.carrier,
      tracking: guide.trackingNumber,
      labelUrl: guide.labelUrl,
    });
    return NextResponse.json({
      tracking: guide.trackingNumber,
      carrier: guide.carrier,
      service: guide.service,
      labelUrl: guide.labelUrl,
      totalPrice: guide.totalPrice,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo generar la guía.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
