import { NextResponse } from "next/server";
import { getCustomerEmail } from "@/lib/customer-auth";
import { getOrder, saveOrder } from "@/lib/orders";
import { verifyToken } from "@/lib/verify";

// El cliente edita la dirección de SU pedido confirmando con el código del
// correo. Solo si el pedido aún no fue enviado.
export async function POST(request: Request) {
  const email = getCustomerEmail(request);
  if (!email) return NextResponse.json({ error: "Inicia sesión de nuevo." }, { status: 401 });

  let body: {
    reference?: string;
    code?: string;
    exp?: number;
    token?: string;
    shipping?: {
      name?: string; phone?: string; address?: string; reference?: string;
      city?: string; department?: string; zip?: string;
    };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!verifyToken(email, body.code || "", body.exp || 0, body.token || "")) {
    return NextResponse.json({ error: "Código incorrecto o vencido." }, { status: 401 });
  }

  const order = await getOrder(body.reference || "");
  if (!order || (order.email || "").toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  if (order.fulfillment === "ENVIADO" || order.fulfillment === "ENTREGADO") {
    return NextResponse.json(
      { error: "Tu pedido ya fue enviado; escríbenos por WhatsApp para ayudarte." },
      { status: 400 }
    );
  }

  const s = body.shipping || {};
  order.shipping = {
    name: (s.name || "").trim(),
    phone: (s.phone || "").trim(),
    address: (s.address || "").trim(),
    reference: (s.reference || "").trim(),
    city: (s.city || "").trim(),
    department: (s.department || "").trim(),
    zip: (s.zip || "").trim(),
    country: "Colombia",
  };
  await saveOrder(order);
  return NextResponse.json({ ok: true, shipping: order.shipping });
}
