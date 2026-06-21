import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";

// Clientes agrupados por correo a partir de los pedidos pagados.
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const all = await listOrders();
    const paid = all.filter((o) => o.status === "APPROVED");

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

    for (const o of paid) {
      const email = (o.email || "").toLowerCase();
      if (!email) continue;
      const name = o.shipping?.name || "";
      const address = [o.shipping?.address, o.shipping?.city, o.shipping?.zip, o.shipping?.country]
        .filter(Boolean)
        .join(", ");
      const when = o.paidAt || o.createdAt;
      const existing = map.get(email);
      if (existing) {
        existing.orders += 1;
        existing.totalSpent += o.amount;
        if (when > existing.lastOrder) {
          existing.lastOrder = when;
          if (name) existing.name = name;
          if (address) existing.lastAddress = address;
        }
      } else {
        map.set(email, {
          email,
          name,
          orders: 1,
          totalSpent: o.amount,
          currency: o.currency,
          lastOrder: when,
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
