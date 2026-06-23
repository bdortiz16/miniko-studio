import { NextResponse } from "next/server";
import { verifyEventSignature } from "@/lib/wompi";
import { getOrder, updateOrderStatus, OrderStatus } from "@/lib/orders";
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email";

// Webhook de eventos de Wompi. Confirma el pago de forma fiable y actualiza
// el estado del pedido en nuestro almacén. Configura esta URL en el panel de
// Wompi: https://<tu-dominio>/api/wompi/webhook

// GET solo informativo (al abrir la URL en el navegador). Wompi usa POST.
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "wompi-webhook",
    message: "Activo. Este endpoint recibe eventos de Wompi por POST.",
  });
}

export async function POST(request: Request) {
  let event: {
    event?: string;
    data?: { transaction?: { id?: string; status?: string; reference?: string } };
    signature?: { checksum?: string; properties?: string[] };
    timestamp?: number;
  };
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!verifyEventSignature(event)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const tx = event.data?.transaction;
  if (tx?.reference && tx.status) {
    const status = tx.status as OrderStatus;
    // Estado anterior para detectar la PRIMERA aprobación y no duplicar correos.
    const prev = await getOrder(tx.reference);
    const order = await updateOrderStatus(tx.reference, status, tx.id);
    if (order && status === "APPROVED" && prev?.status !== "APPROVED") {
      await sendOrderConfirmation(order); // al cliente
      await sendAdminNewOrder(order); // a ti (admin)
    }
  }

  // Wompi espera 200 para no reintentar.
  return NextResponse.json({ received: true });
}
