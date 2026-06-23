import { Resend } from "resend";
import { Order, shortRefFor } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";

// Correos transaccionales del pedido (confirmación de pago y avisos de estado).
// Reutiliza RESEND_API_KEY y EMAIL_FROM ya configurados.

const FROM = process.env.EMAIL_FROM || "Miniko Studio <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://miniko.com.co";

// Bloque de soporte por WhatsApp (si hay número configurado en el panel).
// Muestra el Funko Pop de soporte/WhatsApp y un botón verde para escribir.
async function supportBlock(): Promise<string> {
  try {
    const s = await getSettings();
    const wa = waUrl(s.whatsapp, "Hola Miniko 👋, tengo una duda sobre mi pedido.");
    if (!wa) return "";
    const icon = s.whatsappIcon || s.supportIcon || "";
    const funko = icon
      ? `<a href="${wa}" style="text-decoration:none"><img src="${icon}" alt="Soporte Miniko" width="84" height="84" style="display:inline-block;width:84px;height:84px;object-fit:contain;border:0" /></a>`
      : "";
    return `<div style="text-align:center;margin:26px 0 4px;padding-top:18px;border-top:1px solid #f0f0f0">
      ${funko}
      <p style="font-size:13px;color:#666;margin:8px 0 12px">¿Necesitas ayuda con tu pedido?</p>
      <a href="${wa}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:999px">
        💬 Escríbenos por WhatsApp
      </a>
    </div>`;
  } catch {
    return "";
  }
}

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
  return `<div style="background:#f4f4f5;padding:32px 16px;font-family:system-ui,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ececec;border-radius:16px;overflow:hidden">
      <div style="height:6px;background:#E5322D"></div>
      <div style="padding:32px 32px 8px">
        <div style="font-size:26px;font-weight:800;color:#111;margin-bottom:18px;white-space:nowrap">miniko<span style="color:#E5322D;font-size:15px;vertical-align:super;line-height:0;margin-left:1px">&#9733;</span></div>
        <h1 style="font-size:18px;margin:0 0 12px;color:#111">${title}</h1>
        <div style="font-size:14px;color:#444;line-height:1.6">${inner}</div>
      </div>
      <div style="padding:16px 32px;margin-top:16px;border-top:1px solid #f0f0f0;color:#9a9a9a;font-size:12px">
        Miniko · Pereira, Colombia · <a href="${SITE}" style="color:#9a9a9a;text-decoration:none">miniko.com.co</a>
      </div>
    </div>
  </div>`;
}

// Plantilla reutilizable también desde otros endpoints (p. ej. el código de acceso).
export function emailShell(title: string, inner: string): string {
  return shell(title, inner);
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

// Envío masivo (campaña) a varios correos. Manda un correo individual a cada
// destinatario (no se exponen entre sí), igual que los correos transaccionales
// que sí llegan. Comprueba el error que devuelve Resend (no lanza excepción).
export async function sendCampaign(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Falta configurar el correo (RESEND_API_KEY).");
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const unique = Array.from(new Set(recipients.map((r) => r.trim().toLowerCase()).filter(Boolean)));
  let sent = 0;
  let failed = 0;
  let lastError = "";
  for (const to of unique) {
    try {
      const { error } = await resend.emails.send({ from: FROM, to, subject, html });
      if (error) {
        failed += 1;
        lastError = error.message || String(error);
        console.error("[campaign] error:", error);
      } else {
        sent += 1;
      }
    } catch (err) {
      failed += 1;
      lastError = err instanceof Error ? err.message : "Error de red.";
      console.error("[campaign] excepción:", err);
    }
  }
  return { sent, failed, error: failed ? lastError : undefined };
}

// Código de acceso (2.º paso) para entrar al panel de administración.
export async function sendAdminLoginCode(to: string, code: string): Promise<void> {
  const inner = `
    <p>Usa este código para entrar al panel de administración de miniko:</p>
    <div style="margin:18px 0;text-align:center">
      <span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;background:#f4f4f5;border:1px solid #ececec;border-radius:12px;padding:14px 22px;color:#111">${code}</span>
    </div>
    <p style="font-size:13px;color:#888">El código vence en 10 minutos. Si no intentaste iniciar sesión, ignora este correo y cambia tu contraseña.</p>`;
  await send(to, `Tu código de acceso: ${code}`, shell("Código de acceso", inner));
}

// Confirmación al cliente cuando el pago queda aprobado.
export async function sendOrderConfirmation(order: Order): Promise<void> {
  if (!order.email) return;
  const num = await shortRefFor(order.reference);
  const inner = `
    <p>¡Gracias por tu compra! Recibimos tu pago y ya estamos preparando tu figura. 🎉</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${num}</b>`)}
      ${row("Estilo", `${order.estilo} · ${order.composicion}`)}
      ${row("Total", `<b>${money(order.amount, order.currency)}</b>`)}
    </table>
    <p style="font-size:14px">Te avisaremos en cada paso. Mira el estado en
      <a href="${SITE}/mis-pedidos" style="color:#E5322D">Mis pedidos</a>.</p>`;
  await send(order.email, "Confirmación de tu pedido Miniko 🎁", shell("Pago confirmado", inner + (await supportBlock())));
}

// Aviso al cliente cuando el pedido pasa a EN PRODUCCIÓN.
export async function sendProductionNotice(order: Order): Promise<void> {
  if (!order.email) return;
  const num = await shortRefFor(order.reference);
  const inner = `
    <p>¡Manos a la obra! 🎨 Tu figura ya entró en <b>producción</b>: la estamos modelando e imprimiendo en 3D.</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${num}</b>`)}
      ${row("Estilo", `${order.estilo} · ${order.composicion}`)}
    </table>
    <p style="font-size:14px">Te avisaremos cuando salga para envío. Sigue tu pedido en
      <a href="${SITE}/mis-pedidos" style="color:#E5322D">Mis pedidos</a>.</p>`;
  await send(order.email, "Tu figura Miniko ya está en producción 🎨", shell("En producción", inner + (await supportBlock())));
}

// Aviso al cliente cuando el pedido se marca como ENTREGADO.
export async function sendDeliveredNotice(order: Order): Promise<void> {
  if (!order.email) return;
  const num = await shortRefFor(order.reference);
  const inner = `
    <p>¡Tu pedido fue <b>entregado</b>! 🎉 Esperamos que disfrutes pintando tu figura.</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${num}</b>`)}
    </table>
    <p style="font-size:14px">¿Algún problema con tu entrega? Escríbenos, estamos para ayudarte.</p>`;
  await send(order.email, "¡Tu pedido Miniko fue entregado! 🎉", shell("Entregado", inner + (await supportBlock())));
}

// Aviso al ADMIN (tú) cuando entra un pedido nuevo pagado.
export async function sendAdminNewOrder(order: Order): Promise<void> {
  let to = process.env.ADMIN_EMAIL || "";
  try {
    const s = await getSettings();
    if (s.adminEmail) to = s.adminEmail; // el panel manda sobre la variable
  } catch {}
  if (!to) return; // sin correo configurado, no se envía
  const num = await shortRefFor(order.reference);
  const s = order.shipping || {};
  const dir = [s.address, s.city, s.zip, s.country].filter(Boolean).join(", ");
  const inner = `
    <p>Entró un pedido nuevo pagado. 🎉</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${num}</b>`)}
      ${row("Cliente", order.email || "—")}
      ${row("Estilo", `${order.estilo} · ${order.composicion}`)}
      ${row("Total", `<b>${money(order.amount, order.currency)}</b>`)}
      ${row("Enviar a", `${s.name || "—"}${dir ? `<br>${dir}` : ""}`)}
    </table>
    <p style="font-size:14px"><a href="${SITE}/admin/pedidos" style="color:#E5322D">Abrir el panel de pedidos</a></p>`;
  await send(to, `Nuevo pedido ${num} · ${money(order.amount, order.currency)}`, shell("Nuevo pedido", inner));
}

// Aviso de envío con la guía cuando el admin marca el pedido como ENVIADO.
export async function sendShippingNotice(order: Order): Promise<void> {
  if (!order.email) return;
  const num = await shortRefFor(order.reference);
  const inner = `
    <p>¡Tu figura va en camino! 🚚</p>
    <table style="font-size:14px;margin:12px 0;border-collapse:collapse">
      ${row("Pedido", `<b>${num}</b>`)}
      ${order.carrier ? row("Transportadora", order.carrier) : ""}
      ${order.tracking ? row("Número de guía", `<b>${order.tracking}</b>`) : ""}
    </table>
    <p style="font-size:14px">Sigue tu pedido en
      <a href="${SITE}/mis-pedidos" style="color:#E5322D">Mis pedidos</a>.</p>`;
  await send(order.email, "Tu pedido Miniko va en camino 🚚", shell("Pedido enviado", inner + (await supportBlock())));
}
