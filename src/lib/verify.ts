import crypto from "crypto";

// Verificación de email sin base de datos: el código de 6 dígitos viaja al
// usuario por email; al cliente solo le devolvemos un "token" = HMAC(email|code|exp).
// Para verificar, recomputamos el HMAC y comparamos. Stateless y seguro.

const TTL_MS = 10 * 60 * 1000; // 10 minutos

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.WOMPI_INTEGRITY_SECRET ||
    "miniko-dev-secret-change-me"
  );
}

export function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function sign(email: string, code: string, exp: number): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`${email.toLowerCase()}:${code}:${exp}`)
    .digest("hex");
}

export function makeToken(email: string, code: string) {
  const exp = Date.now() + TTL_MS;
  return { token: sign(email, code, exp), exp };
}

export function verifyToken(
  email: string,
  code: string,
  exp: number,
  token: string
): boolean {
  if (!email || !code || !exp || !token) return false;
  if (Date.now() > exp) return false;
  const expected = sign(email, code, exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
