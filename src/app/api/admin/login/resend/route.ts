import { NextResponse } from "next/server";
import { adminConfigured } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";
import { generateCode, makeToken } from "@/lib/verify";
import { sendAdminLoginCode, emailConfigured } from "@/lib/email";

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

// Reenvía un código de acceso. Requiere de nuevo la contraseña (el primer paso),
// para no permitir reenviar sin haberla validado.
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Login no configurado." }, { status: 500 });
  }
  let email = "";
  let password = "";
  try {
    ({ email = "", password = "" } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const account = await adminEmail();
  const emailOk = !account || email.trim().toLowerCase() === account.toLowerCase();
  if (!emailOk || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }
  if (!account || !emailConfigured()) {
    return NextResponse.json({ error: "No hay correo configurado para enviar el código." }, { status: 400 });
  }

  const code = generateCode();
  const { token, exp } = makeToken(account, code);
  await sendAdminLoginCode(account, code);

  return NextResponse.json({ ok: true, token, exp, hint: maskEmail(account) });
}
