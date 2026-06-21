import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { isAdmin } from "@/lib/admin-auth";

// Métricas para el dashboard de admin, calculadas desde los pedidos de Stripe.
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ configured: false });
  }

  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const paid = sessions.data.filter(
      (s) => s.payment_status === "paid" || s.status === "complete"
    );

    const now = Math.floor(Date.now() / 1000);
    const DAY = 86400;

    let revenue = 0;
    let revenue30 = 0;
    const emails = new Set<string>();
    const byStyle: Record<string, number> = {};
    const byTipo: Record<string, number> = {};
    const currency = (paid[0]?.currency || "cop").toUpperCase();

    // Ingresos por día (últimos 14 días) para el mini-gráfico.
    const days = 14;
    const daily: { label: string; amount: number }[] = Array.from({ length: days }, (_, i) => {
      const d = new Date((now - (days - 1 - i) * DAY) * 1000);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, amount: 0 };
    });

    for (const s of paid) {
      const amt = s.amount_total || 0;
      revenue += amt;
      if (s.created >= now - 30 * DAY) revenue30 += amt;
      const email = (s.customer_details?.email || s.customer_email || "").toLowerCase();
      if (email) emails.add(email);
      const m = s.metadata || {};
      if (m.estilo) byStyle[m.estilo] = (byStyle[m.estilo] || 0) + 1;
      const tipo = m.tipo || "Persona";
      byTipo[tipo] = (byTipo[tipo] || 0) + 1;

      const idx = days - 1 - Math.floor((now - s.created) / DAY);
      if (idx >= 0 && idx < days) daily[idx].amount += amt;
    }

    const orders = paid.length;
    const recent = paid
      .sort((a, b) => b.created - a.created)
      .slice(0, 6)
      .map((s) => {
        const m = s.metadata || {};
        return {
          id: s.id,
          created: s.created,
          email: s.customer_details?.email || s.customer_email || "",
          amount: s.amount_total || 0,
          currency: (s.currency || "cop").toUpperCase(),
          tipo: m.tipo || "",
          estilo: m.estilo || "",
          composicion: m.composicion || m.tamano || "",
        };
      });

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
