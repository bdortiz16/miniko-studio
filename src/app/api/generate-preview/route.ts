import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// La generación de imagen puede tardar; ampliamos al máximo (plan Pro: 300s).
export const maxDuration = 300;

// Cada estilo define el LOOK por completo (antes el prompt forzaba Funko siempre).
const STYLE_PROMPT: Record<string, string> = {
  // Funko Pop
  kawaii:
    "Turn the person in this photo into a classic FUNKO POP collectible vinyl figurine: very large oversized head, small short slim body, big round solid black dot eyes, simplified matte vinyl, standing on a round display base.",
  // Disney
  caricatura:
    "Turn the person in this photo into a DISNEY / PIXAR style 3D animated character figure: full-body stylized cartoon with friendly proportions, large expressive cartoon eyes, smooth polished 3D animation render, standing.",
  // Realista
  realista:
    "Turn the person in this photo into a PHOTOREALISTIC lifelike collectible statue figure: highly detailed realistic face, hair, skin and clothing with realistic human proportions, refined and premium, full body standing on a small base. It is NOT a Funko, NOT a cartoon, NOT a big-head toy — it looks like a real lifelike figure.",
};

const COMMON_PROMPT =
  "Keep the SAME face and exact likeness of the person in the photo: same face shape, eyes, nose, mouth, eyebrows and hairstyle — it must clearly look like the SAME person. " +
  "Preserve their skin tone, facial hair and glasses if any. " +
  "CRITICAL: keep the person's EXACT body type, build and weight from the photo. If they are slim, keep them slim — do NOT make them chubby, fat, heavier or rounder. Match their real silhouette and proportions faithfully. " +
  "Keep the person's outfit if it is normal everyday clothing; BUT if they are wearing swimwear, a bikini, underwear or very revealing clothing, instead dress the figure in tasteful casual everyday clothes (a t-shirt and trousers). Never depict swimwear, lingerie or revealing outfits. " +
  "Tall vertical frame, ZOOMED OUT: the whole figure is SMALL and centered, occupying only about 65% of the frame, with generous empty margin on all sides — clear space above the head AND below the feet/shoes. The full figure from head to shoes is completely visible and never cropped. " +
  "Clean studio product photo, a single figure, soft neutral background, high quality, soft studio lighting.";

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
    const prompt = `${STYLE_PROMPT[styleId] ?? STYLE_PROMPT.kawaii} ${COMMON_PROMPT}`;
    const openai = new OpenAI({ apiKey });
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt,
      size: "1024x1536",
      // moderation "low" reduce rechazos en fotos al límite; el SDK aún no lo tipa.
      ...({ moderation: "low" } as object),
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
