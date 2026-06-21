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
  const from = process.env.EMAIL_FROM || "Miniko Studio <onboarding@resend.dev>";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: `Tu código de verificación: ${code}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#d98c5f">Miniko Studio</h2>
          <p>Tu código de verificación es:</p>
          <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#2b2b2b">${code}</p>
          <p style="color:#666;font-size:14px">Caduca en 10 minutos. Si no lo solicitaste, ignora este email.</p>
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
