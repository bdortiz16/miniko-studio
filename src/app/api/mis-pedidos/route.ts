import { NextResponse } from "next/server";
import { getCustomerEmail } from "@/lib/customer-auth";
import { listOrdersByEmail, FULFILLMENT_LABELS, FulfillmentStatus } from "@/lib/orders";

// Devuelve los pedidos pagados del cliente autenticado (cookie de sesión).
export async function GET(request: Request) {
  const email = getCustomerEmail(request);
  if (!email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const orders = await listOrdersByEmail(email);
    const data = orders.map((o) => ({
      reference: o.reference,
      createdAt: o.paidAt || o.createdAt,
      amount: o.amount,
      currency: o.currency,
      estilo: o.estilo,
      tipo: o.tipo,
      composicion: o.composicion,
      personas: o.personas,
      mascotas: o.mascotas,
      previewUrls: o.previewUrls || [],
      photoUrls: o.photoUrls || [],
      shipping: o.shipping,
      fulfillment: o.fulfillment || "RECIBIDO",
      fulfillmentLabel: FULFILLMENT_LABELS[(o.fulfillment || "RECIBIDO") as FulfillmentStatus],
      carrier: o.carrier || "",
      tracking: o.tracking || "",
      adminNote: o.adminNote || "",
    }));
    return NextResponse.json({ authenticated: true, email, orders: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar pedidos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
