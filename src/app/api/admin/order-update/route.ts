import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { updateOrderFulfillment, FulfillmentStatus } from "@/lib/orders";

const VALID: FulfillmentStatus[] = ["RECIBIDO", "EN_PRODUCCION", "ENVIADO", "ENTREGADO"];

// Actualiza el seguimiento de un pedido (estado, transportadora, guía, nota).
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  let body: {
    reference?: string;
    fulfillment?: string;
    carrier?: string;
    tracking?: string;
    adminNote?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!body.reference) {
    return NextResponse.json({ error: "Falta la referencia." }, { status: 400 });
  }
  const fulfillment =
    body.fulfillment && VALID.includes(body.fulfillment as FulfillmentStatus)
      ? (body.fulfillment as FulfillmentStatus)
      : undefined;

  const order = await updateOrderFulfillment(body.reference, {
    fulfillment,
    carrier: body.carrier,
    tracking: body.tracking,
    adminNote: body.adminNote,
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
