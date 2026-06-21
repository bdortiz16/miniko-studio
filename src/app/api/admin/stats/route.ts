import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";

// Métricas del dashboard, calculadas desde nuestro almacén de pedidos.
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const all = await listOrders();
    const paid = all.filter((o) => o.status === "APPROVED");

    const now = Math.floor(Date.now() / 1000);
    const DAY = 86400;

    let revenue = 0;
    let revenue30 = 0;
    const emails = new Set<string>();
    const byStyle: Record<string, number> = {};
    const byTipo: Record<string, number> = {};
    const currency = paid[0]?.currency || "COP";

    const days = 14;
    const daily: { label: string; amount: number }[] = Array.from({ length: days }, (_, i) => {
      const d = new Date((now - (days - 1 - i) * DAY) * 1000);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, amount: 0 };
    });

    for (const o of paid) {
      const when = o.paidAt || o.createdAt;
      revenue += o.amount;
      if (when >= now - 30 * DAY) revenue30 += o.amount;
      if (o.email) emails.add(o.email.toLowerCase());
      if (o.estilo) byStyle[o.estilo] = (byStyle[o.estilo] || 0) + 1;
      const tipo = o.tipo || "Persona";
      byTipo[tipo] = (byTipo[tipo] || 0) + 1;
      const idx = days - 1 - Math.floor((now - when) / DAY);
      if (idx >= 0 && idx < days) daily[idx].amount += o.amount;
    }

    const orders = paid.length;
    const recent = paid.slice(0, 6).map((o) => ({
      id: o.reference,
      created: o.paidAt || o.createdAt,
      email: o.email,
      amount: o.amount,
      currency: o.currency,
      tipo: o.tipo,
      estilo: o.estilo,
      composicion: o.composicion,
    }));

    return NextResponse.json({
      configured: true,
      currency,
      revenue,
      revenue30,
      orders,
      customers: emails.size,
      avgOrder: orders ? Math.round(revenue / orders) : 0,
      byStyle,
      byTipo,
      daily,
      recent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar métricas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
