import crypto from "crypto";

// Sesión de cliente para "Mis pedidos": tras verificar su email con código,
// guardamos una cookie firmada (HMAC) con su correo. Sin base de datos.

const SESSION_MSG = "miniko-customer-session-v1";
export const CUSTOMER_COOKIE = "miniko_customer";

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.WOMPI_INTEGRITY_SECRET ||
    "miniko-dev-secret-change-me"
  );
}

// Token = email|firma. La firma evita que alguien falsifique el correo.
export function customerToken(email: string): string {
  const e = email.toLowerCase().trim();
  const sig = crypto.createHmac("sha256", secret()).update(`${e}:${SESSION_MSG}`).digest("hex");
  return `${e}|${sig}`;
}

// Devuelve el email del cliente autenticado, o null si la cookie no es válida.
export function getCustomerEmail(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)miniko_customer=([^;]+)/);
  if (!m) return null;
  const value = decodeURIComponent(m[1]);
  const [email, sig] = value.split("|");
  if (!email || !sig) return null;
  const expected = customerToken(email);
  const a = Buffer.from(`${email}|${sig}`);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? email : null;
}
