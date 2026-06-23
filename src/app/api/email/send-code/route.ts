import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateCode, makeToken, isValidEmail } from "@/lib/verify";
import { emailShell } from "@/lib/email";

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
      html: emailShell(
        "Tu código de acceso",
        `<p style="margin:0 0 6px">Úsalo para entrar a tu zona de pedidos:</p>
         <div style="background:#faf6f5;border:1px solid #f0e3e0;border-radius:12px;padding:18px;text-align:center;margin:14px 0 6px">
           <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#111">${code}</span>
         </div>
         <p style="color:#888;font-size:13px;margin:10px 0 0">Caduca en 10 minutos. Si no lo solicitaste, ignora este correo.</p>`
      ),
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar el email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Nunca devolvemos el código; solo el token firmado y su caducidad.
  return NextResponse.json({ token, exp });
}
