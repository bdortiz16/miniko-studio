import { emailShell } from "@/lib/email";

export interface MarketingContent {
  subject: string;
  headline: string;
  bodyHtml: string; // párrafos <p> ya formateados
  ctaText?: string;
  ctaUrl?: string;
  images?: string[]; // URLs absolutas (Supabase) a mostrar en el correo
}

// Arma el correo de campaña con la misma plantilla de marca (estrella + pie)
// que usan los correos transaccionales. Se usa tanto para la vista previa como
// para el envío, así el cliente ve exactamente lo que se manda.
export function buildMarketingEmail(c: MarketingContent): string {
  const imgs = (c.images || [])
    .filter(Boolean)
    .map(
      (u) =>
        `<img src="${u}" alt="" style="display:block;width:100%;max-width:416px;border-radius:12px;margin:16px auto;border:0" />`
    )
    .join("");

  const cta =
    c.ctaText && c.ctaUrl
      ? `<div style="text-align:center;margin:24px 0 6px">
           <a href="${c.ctaUrl}" style="display:inline-block;background:#E5322D;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:999px">
             ${c.ctaText}
           </a>
         </div>`
      : "";

  const inner = `${imgs}${c.bodyHtml}${cta}`;
  return emailShell(c.headline, inner);
}
