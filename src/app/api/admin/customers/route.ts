import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { isAdmin } from "@/lib/admin-auth";

// Lista de clientes agrupados por correo, a partir de los pedidos pagados de
// Stripe. Para cada cliente: nº de pedidos, total gastado, último pedido, etc.
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no está configurado." }, { status: 500 });
  }

  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const paid = sessions.data.filter(
      (s) => s.payment_status === "paid" || s.status === "complete"
    );

    const map = new Map<
      string,
      {
        email: string;
        name: string;
        orders: number;
        totalSpent: number;
        currency: string;
        lastOrder: number;
        lastAddress: string;
      }
    >();

    for (const s of paid) {
      const m = s.metadata || {};
      const email = (s.customer_details?.email || s.customer_email || "").toLowerCase();
      if (!email) continue;
      const name = m.envio_nombre || s.customer_details?.name || "";
      const address = m.envio_direccion || "";
      const existing = map.get(email);
      if (existing) {
        existing.orders += 1;
        existing.totalSpent += s.amount_total || 0;
        if (s.created > existing.lastOrder) {
          existing.lastOrder = s.created;
          if (name) existing.name = name;
          if (address) existing.lastAddress = address;
        }
      } else {
        map.set(email, {
          email,
          name,
          orders: 1,
          totalSpent: s.amount_total || 0,
          currency: (s.currency || "cop").toUpperCase(),
          lastOrder: s.created,
          lastAddress: address,
        });
      }
    }

    const customers = Array.from(map.values()).sort((a, b) => b.lastOrder - a.lastOrder);
    return NextResponse.json({ customers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar clientes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
