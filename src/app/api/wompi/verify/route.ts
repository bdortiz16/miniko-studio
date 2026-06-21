import { NextResponse } from "next/server";
import { getTransaction } from "@/lib/wompi";
import { updateOrderStatus, OrderStatus } from "@/lib/orders";

// Verifica una transacción de Wompi por su id (la usa la página de éxito tras
// la redirección). Actualiza el estado del pedido y devuelve el resultado.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const tx = await getTransaction(id);
  if (!tx) {
    return NextResponse.json({ status: "PENDING", found: false });
  }

  if (tx.reference) {
    await updateOrderStatus(tx.reference, tx.status as OrderStatus, tx.id);
  }

  return NextResponse.json({
    status: tx.status,
    reference: tx.reference,
    amount: tx.amount_in_cents,
    currency: tx.currency,
    found: true,
  });
}
