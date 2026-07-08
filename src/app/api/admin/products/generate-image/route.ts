import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

export const maxDuration = 120;

// Genera una imagen de producto con IA (gpt-image-1) y la sube a Supabase.
export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Falta Supabase." }, { status: 500 });

  let body: { name?: string; description?: string; design?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Falta el nombre del producto." }, { status: 400 });

  const prompt = `Professional e-commerce product photo of a 3D printed "${name}"${
    body.design ? ` design: ${body.design}` : ""
  }${body.description ? `, ${body.description}` : ""}. Centered, soft studio lighting, clean solid light background, high detail, realistic plastic/PLA finish, no text, no watermark.`;

  try {
    const openai = new OpenAI({ apiKey });
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      ...({ output_format: "png", quality: "medium" } as object),
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("La IA no devolvió imagen.");
    const buf = Buffer.from(b64, "base64");
    const path = `productos/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(path, buf, { contentType: "image/png", upsert: true, cacheControl: "3600" });
    if (error) throw new Error(error.message);
    const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: `${data.publicUrl}?v=${Date.now()}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo generar la imagen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
