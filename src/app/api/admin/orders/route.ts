import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Lista los últimos pedidos pagados desde Stripe para el panel de admin.
export async function GET(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no está configurado." }, { status: 500 });
  }
  // Protección opcional: si AUTH_SECRET está definido, exige ?token=...
  const required = process.env.AUTH_SECRET;
  const token = new URL(request.url).searchParams.get("token");
  if (required && token !== required) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 50 });
    const orders = sessions.data
      .filter((s) => s.payment_status === "paid" || s.status === "complete")
      .map((s) => {
        const m = s.metadata || {};
        const fotos = Object.keys(m)
          .filter((k) => k.startsWith("foto_"))
          .sort()
          .map((k) => m[k])
          .filter(Boolean);
        return {
          id: s.id,
          created: s.created,
          email: s.customer_details?.email || s.customer_email || "",
          amount: s.amount_total,
          currency: (s.currency || "eur").toUpperCase(),
          estilo: m.estilo || "",
          tamano: m.tamano || m["tamaño"] || "",
          personas: m.personas || "",
          envio_nombre: m.envio_nombre || s.customer_details?.name || "",
          envio_direccion: m.envio_direccion || "",
          fotos,
          figura_ia: m.figura_ia || "",
        };
      });
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar pedidos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
