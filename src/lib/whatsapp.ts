// Construye el enlace de WhatsApp (wa.me) a partir de un número.
// El admin solo pone el número; aquí lo normalizamos y armamos la URL.

export function waNumber(raw?: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  // Número colombiano de 10 dígitos sin indicativo -> anteponer 57.
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function waUrl(raw?: string, text?: string): string {
  const n = waNumber(raw);
  if (!n) return "";
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${n}${q}`;
}
