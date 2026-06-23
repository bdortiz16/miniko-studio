import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isAdmin } from "@/lib/admin-auth";
import { buildMarketingEmail } from "@/lib/marketing-email";

export const maxDuration = 60;

// Redacta un correo de campaña a partir de lo que escribe el admin. Usa la IA
// solo para el texto (asunto, titular y cuerpo); las imágenes y el botón los
// arma nuestra plantilla de marca.
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: { brief?: string; images?: string[]; ctaUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const brief = (body.brief || "").trim();
  if (!brief) {
    return NextResponse.json({ error: "Escribe qué quieres decirles a tus clientes." }, { status: 400 });
  }
  const images = (body.images || []).filter(Boolean).slice(0, 4);
  const ctaUrl = (body.ctaUrl || "").trim() || "https://miniko.com.co/pedido";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  }

  const system = `Eres el redactor de marketing de "miniko", una tienda colombiana que convierte fotos en figuras coleccionables tipo Funko pintadas a mano (estilos Clásico, Animado y Realista). Escribes correos cálidos, cercanos y en español de Colombia, con un toque divertido y uno o dos emojis. Nada de promesas falsas ni mayúsculas sostenidas. Devuelves SOLO un JSON con estas claves:
{
  "subject": "asunto corto y atractivo (máx 60 caracteres)",
  "headline": "titular del correo (máx 50 caracteres)",
  "bodyHtml": "el cuerpo en HTML simple: 2 a 4 etiquetas <p>...</p>, puedes usar <b>. Sin <html>, <head>, <style>, ni imágenes.",
  "ctaText": "texto del botón (máx 28 caracteres), ej. 'Crear mi figura'"
}`;

  const user = `Brief del dueño de la tienda: """${brief}"""
${images.length ? `El correo incluirá ${images.length} imagen(es) que ya tengo.` : ""}
Redacta el correo siguiendo el JSON pedido.`;

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let parsed: { subject?: string; headline?: string; bodyHtml?: string; ctaText?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("La IA no devolvió un correo válido. Intenta de nuevo.");
    }

    const subject = (parsed.subject || "Novedades de miniko").trim();
    const headline = (parsed.headline || subject).trim();
    const bodyHtml = (parsed.bodyHtml || "<p>¡Tenemos novedades para ti!</p>").trim();
    const ctaText = (parsed.ctaText || "Crear mi figura").trim();

    const html = buildMarketingEmail({ subject, headline, bodyHtml, ctaText, ctaUrl, images });

    return NextResponse.json({ subject, html, headline, bodyHtml, ctaText, ctaUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo redactar el correo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
