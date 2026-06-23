import { Resend } from "resend";
import { Order } from "@/lib/orders";

// Correos transaccionales del pedido (confirmación de pago y aviso de envío).
// Reutiliza RESEND_API_KEY y EMAIL_FROM ya configurados.

const FROM = process.env.EMAIL_FROM || "Miniko Studio <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://miniko.com.co";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  } catch {
    return `$${Math.round(amount / 100).toLocaleString("es-CO")}`;
  }
}

function shell(title: string, inner: string): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2b2b">
    <h2 style="margin:0 0 4px;font-size:24px">miniko<span style="color:#E5322D">.</span></h2>
    <h3 style="margin:16px 0 8px">${title}</h3>
    ${inner}
    <p style="color:#999;font-size:12px;margin-top:24px">Miniko · Pereira, Colombia · <a href="${SITE}" style="color:#999">miniko.com.co</a></p>
  </div>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#888">${label}</td><td>${value}</td></tr>`;
}

// No lanza: si falla el correo, el flujo del pedido sigue.
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] error:", err);
  }
}

// Confirmación al cliente cuando el pago queda aprobado.
export async function sendOrderConfirmation(order: Order): Promise<void> {
  if (!order.email) return;
  const inner = `
    <p>¡Gracias por tu compra! Recibimos tu pago y ya estamos preparando tu figura. 🎉</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${order.reference}</b>`)}
      ${row("Estilo", `${order.estilo} · ${order.composicion}`)}
      ${row("Total", `<b>${money(order.amount, order.currency)}</b>`)}
    </table>
    <p style="font-size:14px">Te avisaremos cuando salga para envío. Mira el estado en
      <a href="${SITE}/mis-pedidos" style="color:#E5322D">Mis pedidos</a>.</p>`;
  await send(order.email, "Confirmación de tu pedido Miniko 🎁", shell("Pago confirmado", inner));
}

// Aviso al ADMIN (tú) cuando entra un pedido nuevo pagado.
export async function sendAdminNewOrder(order: Order): Promise<void> {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return; // sin ADMIN_EMAIL configurado, no se envía
  const s = order.shipping || {};
  const dir = [s.address, s.city, s.zip, s.country].filter(Boolean).join(", ");
  const inner = `
    <p>Entró un pedido nuevo pagado. 🎉</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${order.reference}</b>`)}
      ${row("Cliente", order.email || "—")}
      ${row("Estilo", `${order.estilo} · ${order.composicion}`)}
      ${row("Total", `<b>${money(order.amount, order.currency)}</b>`)}
      ${row("Enviar a", `${s.name || "—"}${dir ? `<br>${dir}` : ""}`)}
    </table>
    <p style="font-size:14px"><a href="${SITE}/admin/pedidos" style="color:#E5322D">Abrir el panel de pedidos</a></p>`;
  await send(to, `Nuevo pedido ${order.reference} · ${money(order.amount, order.currency)}`, shell("Nuevo pedido", inner));
}

// Aviso de envío con la guía cuando el admin marca el pedido como ENVIADO.
export async function sendShippingNotice(order: Order): Promise<void> {
  if (!order.email) return;
  const inner = `
    <p>¡Tu figura va en camino! 🚚</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${order.reference}</b>`)}
      ${order.carrier ? row("Transportadora", order.carrier) : ""}
      ${order.tracking ? row("Número de guía", `<b>${order.tracking}</b>`) : ""}
    </table>
    <p style="font-size:14px">Sigue tu pedido en
      <a href="${SITE}/mis-pedidos" style="color:#E5322D">Mis pedidos</a>.</p>`;
  await send(order.email, "Tu pedido Miniko va en camino 🚚", shell("Pedido enviado", inner));
}
