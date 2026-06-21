import { NextResponse } from "next/server";
import { verifyToken, isValidEmail } from "@/lib/verify";
import { customerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";

// Verifica el código de 6 dígitos (enviado vía /api/email/send-code) y, si es
// correcto, abre la sesión del cliente para ver "Mis pedidos".
export async function POST(request: Request) {
  let body: { email?: string; code?: string; exp?: number; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const { email = "", code = "", exp = 0, token = "" } = body;
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }
  if (!verifyToken(email, code, exp, token)) {
    return NextResponse.json({ error: "Código incorrecto o caducado." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, customerToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
