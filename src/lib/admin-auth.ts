import crypto from "crypto";

// Autenticación simple de administrador con contraseña (ADMIN_PASSWORD).
// El token de sesión es un HMAC derivado de la contraseña, guardado en una
// cookie httpOnly. Solo quien conoce la contraseña puede generarlo (vía login).

const SESSION_MSG = "miniko-admin-session-v1";
export const ADMIN_COOKIE = "miniko_admin";

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD || "";
  return crypto.createHmac("sha256", pw).update(SESSION_MSG).digest("hex");
}

// Comprueba si la petición está autenticada como admin.
// Si ADMIN_PASSWORD no está configurada, el panel queda abierto (sin proteger)
// para que puedas usarlo mientras configuras la contraseña.
export function isAdmin(request: Request): boolean {
  if (!adminConfigured()) return true;
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)miniko_admin=([^;]+)/);
  const value = m ? decodeURIComponent(m[1]) : "";
  const expected = adminToken();
  if (value.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
