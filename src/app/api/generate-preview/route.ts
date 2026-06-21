import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// La generación de imagen puede tardar; ampliamos el límite (requiere plan Pro).
export const maxDuration = 60;

const BASE_PROMPT =
  "Create a clean studio product photo of a Funko Pop style collectible vinyl figurine based on the person in this photo. " +
  "Use classic Funko Pop proportions: a large oversized head and a SMALL, SLIM, PETITE body with a narrow torso and short, thin limbs " +
  "(the body is clearly smaller and slimmer than the head, not chubby or wide). Standing on a round display base, on a soft neutral white background. " +
  "Preserve the person's recognizable features: hairstyle and hair color, skin tone, facial hair, glasses if any. " +
  "Recreate the exact same outfit, clothing and colors the person is wearing in the photo, faithfully. " +
  "A single figurine, centered, high quality, soft studio lighting.";

const STYLE_PROMPT: Record<string, string> = {
  kawaii:
    "Style: cute kawaii chibi — extra-large head, big glossy sparkling eyes, tiny simplified nose, soft rounded shapes, gentle pastel tones, adorable expression.",
  realista:
    "Style: realistic premium collectible — finely detailed, accurate proportions, lifelike face sculpt and refined paintwork.",
  caricatura:
    "Style: fun exaggerated cartoon caricature — big expressive features, playful proportions, bold vibrant colors, full of personality.",
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "La IA no está configurada (falta OPENAI_API_KEY)." },
      { status: 500 }
    );
  }

  let photoUrl = "";
  let styleId = "";
  try {
    ({ photoUrl, styleId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!photoUrl) {
    return NextResponse.json({ error: "Falta la foto." }, { status: 400 });
  }

  try {
    // 1) Descargar la foto subida por el cliente.
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) throw new Error("No se pudo leer la foto subida.");
    const inputMime = imgRes.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ext = inputMime.includes("png") ? "png" : inputMime.includes("webp") ? "webp" : "jpg";
    const file = await toFile(buffer, `foto.${ext}`, { type: inputMime });

    // 2) Generar la figura con gpt-image-1 (edición a partir de la foto).
    const prompt = `${BASE_PROMPT} ${STYLE_PROMPT[styleId] ?? ""}`;
    const openai = new OpenAI({ apiKey });
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt,
      size: "1024x1024",
    });

    const outB64 = result.data?.[0]?.b64_json;
    if (!outB64) {
      throw new Error("La IA no devolvió una imagen. Prueba con otra foto.");
    }

    // 3) Guardar el resultado en Supabase y devolver su URL pública.
    if (supabaseAdmin) {
      const path = `previews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { error } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .upload(path, Buffer.from(outB64, "base64"), {
          contentType: "image/png",
          upsert: false,
        });
      if (!error) {
        const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
        return NextResponse.json({ url: data.publicUrl });
      }
    }

    // Fallback: devolver la imagen embebida si Supabase no está disponible.
    return NextResponse.json({ url: `data:image/png;base64,${outB64}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar la figura.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
