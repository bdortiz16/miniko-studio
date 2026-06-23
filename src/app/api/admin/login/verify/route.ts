import { NextResponse } from "next/server";
import { makeSession, ADMIN_COOKIE, adminConfigured, SESSION_TTL_MS } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";
import { verifyToken } from "@/lib/verify";
import { hitRateLimit, clientIp } from "@/lib/rate-limit";

async function adminEmail(): Promise<string> {
  try {
    const s = await getSettings();
    return (s.adminEmail || process.env.ADMIN_EMAIL || "").trim();
  } catch {
    return (process.env.ADMIN_EMAIL || "").trim();
  }
}

// Paso 2 del login: valida el código del correo y abre la sesión.
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Login no configurado." }, { status: 500 });
  }
  // Anti fuerza bruta del código: máx 10 intentos por IP cada 10 minutos.
  const rl = hitRateLimit(`verify:${clientIp(request)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }
  let body: { code?: string; token?: string; exp?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const email = await adminEmail();
  const code = (body.code || "").trim();
  if (!verifyToken(email, code, body.exp || 0, body.token || "")) {
    return NextResponse.json({ error: "Código incorrecto o vencido." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const session = makeSession(SESSION_TTL_MS);
  res.cookies.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
