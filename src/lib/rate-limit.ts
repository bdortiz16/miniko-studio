// Limitador de intentos en memoria (best-effort). Sirve para frenar fuerza
// bruta en el login. Nota: en serverless el estado no se comparte entre
// instancias y se reinicia en frío; es una capa extra, no una garantía total.
// El segundo factor (código por correo) es la protección principal.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

// Cuenta un intento para `key`. Permite hasta `max` dentro de `windowMs`.
export function hitRateLimit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now();
  const b = store.get(key);
  if (!b || now > b.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > max) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: max - b.count, retryAfterSec: 0 };
}

// Libera el contador de una clave (p. ej. tras un login exitoso).
export function clearRateLimit(key: string): void {
  store.delete(key);
}

// IP del cliente a partir de las cabeceras (Vercel usa x-forwarded-for).
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}
