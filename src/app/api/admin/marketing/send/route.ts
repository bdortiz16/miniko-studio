import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";
import { sendCampaign } from "@/lib/email";

export const maxDuration = 120;

// Correos únicos de los clientes con pedido pagado.
async function customerEmails(): Promise<string[]> {
  const all = await listOrders();
  const set = new Set<string>();
  for (const o of all) {
    if (o.status === "APPROVED" && o.email) set.add(o.email.trim().toLowerCase());
  }
  return Array.from(set);
}

// GET: cuántos clientes recibirían el correo (para mostrar el número).
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const emails = await customerEmails();
  return NextResponse.json({ total: emails.length });
}

// POST: envía la campaña a todos los clientes.
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: { subject?: string; html?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const subject = (body.subject || "").trim();
  const html = (body.html || "").trim();
  if (!subject || !html) {
    return NextResponse.json({ error: "Falta el asunto o el contenido del correo." }, { status: 400 });
  }

  const emails = await customerEmails();
  if (emails.length === 0) {
    return NextResponse.json({ error: "Todavía no tienes clientes con pedidos pagados." }, { status: 400 });
  }

  try {
    const { sent, failed } = await sendCampaign(emails, subject, html);
    return NextResponse.json({ ok: true, sent, failed, total: emails.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo enviar la campaña.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
