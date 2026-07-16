import { NextResponse } from "next/server";
import { verifyEventSignature } from "@/lib/wompi";
import { getOrder, updateOrderStatus, saveOrder, OrderStatus } from "@/lib/orders";
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email";
import { decrementStock, getProduct } from "@/lib/products";
import { ensurePetForOrder } from "@/lib/pets";

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
      // Descuenta stock de los productos de la Tienda (una sola vez).
      if (order.items?.length && !order.stockApplied) {
        try {
          await decrementStock(order.items.map((i) => ({ productId: i.productId, qty: i.qty })));
          order.stockApplied = true;
          await saveOrder(order);
        } catch {}
      }
      // Si el pedido incluye una placa NFC, crea la página de la mascota para
      // que el admin tenga la URL a grabar en el chip desde ya.
      if (order.items?.length) {
        try {
          const products = await Promise.all(order.items.map((i) => getProduct(i.productId)));
          if (products.some((p) => p?.nfc)) await ensurePetForOrder(order);
        } catch {}
      }
    }
  }

  // Wompi espera 200 para no reintentar.
  return NextResponse.json({ received: true });
}
