import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getOrder, updateOrderFulfillment, FulfillmentStatus } from "@/lib/orders";
import { sendShippingNotice } from "@/lib/email";

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

  // Estado anterior, para enviar el aviso solo al pasar a ENVIADO la 1.ª vez.
  const prev = await getOrder(body.reference);
  const order = await updateOrderFulfillment(body.reference, {
    fulfillment,
    carrier: body.carrier,
    tracking: body.tracking,
    adminNote: body.adminNote,
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  if (fulfillment === "ENVIADO" && prev?.fulfillment !== "ENVIADO") {
    await sendShippingNotice(order);
  }
  return NextResponse.json({ ok: true });
}
