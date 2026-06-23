import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateCode, makeToken, isValidEmail } from "@/lib/verify";

export async function POST(request: Request) {
  let email = "";
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "El envío de email no está configurado (falta RESEND_API_KEY)." },
      { status: 500 }
    );
  }

  const code = generateCode();
  const { token, exp } = makeToken(email, code);
  const from = process.env.EMAIL_FROM || "Miniko <onboarding@resend.dev>";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Tu código de acceso · Miniko",
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2b2b">
          <h2 style="margin:0 0 4px;font-size:24px">miniko<span style="color:#E5322D">.</span></h2>
          <h3 style="margin:16px 0 8px">Tu código de acceso</h3>
          <p style="font-size:14px;color:#555">Úsalo para entrar a tu zona de pedidos:</p>
          <p style="font-size:34px;font-weight:800;letter-spacing:8px;color:#111;margin:12px 0">${code}</p>
          <p style="color:#888;font-size:13px">Caduca en 10 minutos. Si no lo solicitaste, ignora este correo.</p>
          <p style="color:#999;font-size:12px;margin-top:24px">Miniko · Pereira, Colombia · miniko.com.co</p>
        </div>`,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar el email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Nunca devolvemos el código; solo el token firmado y su caducidad.
  return NextResponse.json({ token, exp });
}
