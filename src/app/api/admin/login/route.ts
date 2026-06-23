import { NextResponse } from "next/server";
import { makeSession, ADMIN_COOKIE, adminConfigured, SESSION_TTL_MS } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";
import { generateCode, makeToken } from "@/lib/verify";
import { sendAdminLoginCode, emailConfigured } from "@/lib/email";

// Correo al que se envía el código de acceso (correo de avisos del admin).
async function adminEmail(): Promise<string> {
  try {
    const s = await getSettings();
    return (s.adminEmail || process.env.ADMIN_EMAIL || "").trim();
  } catch {
    return (process.env.ADMIN_EMAIL || "").trim();
  }
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const shown = user.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// Paso 1 del login: valida la contraseña y envía un código al correo del admin.
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Configura ADMIN_PASSWORD en Vercel para activar el login." },
      { status: 500 }
    );
  }
  let password = "";
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const email = await adminEmail();

  // Si no hay correo de avisos o el correo no está configurado, entramos directo
  // (no se puede enviar el código): así no quedas bloqueado fuera del panel.
  if (!email || !emailConfigured()) {
    const res = NextResponse.json({ step: "done" });
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

  // Genera y envía el código; devolvemos el token firmado (no el código).
  const code = generateCode();
  const { token, exp } = makeToken(email, code);
  await sendAdminLoginCode(email, code);

  return NextResponse.json({ step: "code", token, exp, hint: maskEmail(email) });
}
