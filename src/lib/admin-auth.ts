import crypto from "crypto";

// Sesión de administrador con vencimiento por inactividad (2 horas).
// El token de cookie es `${exp}.${firma}` con firma = HMAC(secreto, "v2:exp").
// El secreto deriva de ADMIN_PASSWORD: si cambias la contraseña, las sesiones
// existentes dejan de valer. La cookie se renueva (sliding) en cada navegación
// del panel (middleware) y con la actividad real del usuario (heartbeat).

export const ADMIN_COOKIE = "miniko_admin";
const SESSION_PREFIX = "miniko-admin-v2";
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas de inactividad

function secret(): string {
  return process.env.ADMIN_PASSWORD || process.env.AUTH_SECRET || "miniko-dev-secret";
}

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

function sign(exp: number): string {
  return crypto.createHmac("sha256", secret()).update(`${SESSION_PREFIX}:${exp}`).digest("hex");
}

// Crea el valor de cookie de sesión que vence dentro de `ttlMs`.
export function makeSession(ttlMs: number = SESSION_TTL_MS): { value: string; maxAge: number } {
  const exp = Date.now() + ttlMs;
  return { value: `${exp}.${sign(exp)}`, maxAge: Math.floor(ttlMs / 1000) };
}

// Valida el token: firma correcta y no vencido.
export function validateToken(value: string): boolean {
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const exp = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!exp || Number.isNaN(exp) || Date.now() > exp) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Comprueba si la petición está autenticada como admin.
// Si ADMIN_PASSWORD no está configurada, el panel queda abierto (sin proteger).
export function isAdmin(request: Request): boolean {
  if (!adminConfigured()) return true;
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)miniko_admin=([^;]+)/);
  const value = m ? decodeURIComponent(m[1]) : "";
  return validateToken(value);
}
